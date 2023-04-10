import { Op } from "@sequelize/core";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { LoggerService } from "../logger/LoggerService";
import { PSqlService } from "../psql/PSqlService";
import { RedisService } from "../redis/RedisService";
import { IFriendService } from "./IFriendService";

export class FriendService implements IFriendService {
    /**
     * The PSQL client instance
     */
    private readonly psqlClient: PSqlService;

    /**
     * The LoggerService instance used for logging exceptions to the mongo database
     */
    private readonly loggerService: LoggerService;

    /**
     * The redis service instance used to access the database
     */
    private readonly redisService: RedisService;

    /**
     * Three-arg constructor, takes in a sql client used for interacting with the database that stores friend information,
     * and takes in an LoggerService instance used for logging exceptions to the mongo database.
     *
     * @param _psqlClient - The psql client which is used to access friend information
     * @param _loggerService - The logger service which is used to add logs to the mongo database
     */
    public constructor(
        _psqlClient: PSqlService,
        _loggerService: LoggerService,
        _redisService: RedisService,
    ) {
        this.psqlClient = _psqlClient;
        this.loggerService = _loggerService;
        this.redisService = _redisService;
    }

    /** @inheritdoc */
    public doesFriendRequestExist = async (
        usernameTo: string,
        usernameFrom: string,
    ): Promise<boolean> => {
        const doesFriendRequestAlreadyExist =
            await this.psqlClient.friendRequestRepo.findOne({
                where: { sender: usernameFrom, username: usernameTo },
            });
        return doesFriendRequestAlreadyExist !== null;
    };

    /** @inheritdoc */
    public add = async (
        id: string,
        usernameTo: string,
        usernameFrom: string,
        customMessage?: string,
    ): Promise<ApiResponse<boolean>> => {
        if (usernameTo === undefined || usernameFrom === undefined) {
            return new ApiResponse(id, false);
        }

        const doesExist = await this.doesFriendRequestExist(
            usernameTo,
            usernameFrom,
        );

        if (doesExist) {
            return new ApiResponse(id, false);
        }

        const insertionResult = await this.psqlClient.friendRequestRepo.create({
            customMessage,
            sender: usernameFrom,
            username: usernameTo,
        });

        return new ApiResponse(id, insertionResult !== null);
    };

    /** @inheritdoc */
    public availableFriends = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<string[]>> => {
        if (username === undefined) {
            return new ApiResponse(id, [] as string[]);
        }

        const allAvailableUsers = await this.psqlClient.userRepo.findAll({
            attributes: ["username"],
            where: {
                username: {
                    [Op.not]: username,
                },
            },
        });

        const availableUsersPromisesCollections: Promise<number>[][] = [];

        allAvailableUsers.forEach((eachAvailableUser) => {
            console.log("user = ", eachAvailableUser.username);
            const availableUserPromise: Promise<number>[] = [];
            availableUserPromise.push(
                this.psqlClient.friendRequestRepo.count({
                    where: {
                        sender: username,
                        username: eachAvailableUser.username,
                    },
                }),
            );
            availableUserPromise.push(
                this.psqlClient.blockRepo.count({
                    where: {
                        [Op.or]: [
                            {
                                sender: username,
                                username: eachAvailableUser.username,
                            },
                            {
                                sender: eachAvailableUser.username,
                                username,
                            },
                        ],
                    },
                }),
            );
            availableUserPromise.push(
                this.psqlClient.friendRepo.count({
                    where: {
                        [Op.or]: [
                            {
                                recipient: eachAvailableUser.username,
                                sender: username,
                            },
                            {
                                recipient: username,
                                sender: eachAvailableUser.username,
                            },
                        ],
                    },
                }),
            );
            availableUsersPromisesCollections.push(availableUserPromise);
        });

        const results: number[][] = [];
        for (const eachPromiseArr of availableUsersPromisesCollections) {
            // eslint-disable-next-line no-await-in-loop -- disabled, required
            results.push(await Promise.all(eachPromiseArr));
        }

        const availableFriends: string[] = [];
        results.forEach((eachSubArray: number[], index: number) => {
            const total = eachSubArray.reduce((e1, e2) => e1 + e2, 0);
            if (total === 0) {
                availableFriends.push(allAvailableUsers[index].username);
            }
        });

        return new ApiResponse(id, availableFriends);
    };
}
