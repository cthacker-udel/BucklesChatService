import { Op } from "@sequelize/core";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { LoggerService } from "../logger/LoggerService";
import { PSqlService } from "../psql/PSqlService";
import { RedisService } from "../redis/RedisService";
import { IFriendService } from "./IFriendService";
import { FriendRequest } from "../../models/sequelize/FriendRequest";
import { User } from "../../models/sequelize/User";
import { FriendRequestDTO } from "../../@types/friend/FriendRequestDTO";

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
    public doesFriendshipExist = async (
        recipient: string,
        sender: string,
    ): Promise<boolean> => {
        const doesFriendshipExist = await this.psqlClient.friendRepo.findOne({
            where: {
                [Op.or]: [
                    { recipient, sender },
                    { recipient: sender, sender: recipient },
                ],
            },
        });

        return doesFriendshipExist !== null;
    };

    /** @inheritdoc */
    public sendRequest = async (
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

    /** @inheritdoc */
    public pendingRequests = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<FriendRequestDTO[]>> => {
        const foundFriendRequests =
            await this.psqlClient.friendRequestRepo.findAll({
                attributes: [
                    "username",
                    "sender",
                    ["custom_message", "customMessage"],
                    ["created_at", "createdAt"],
                ],
                where: { username },
            });
        const senderProfilePictures: Promise<User | null>[] = [];
        foundFriendRequests.forEach((eachFriendRequest: FriendRequest) => {
            senderProfilePictures.push(
                this.psqlClient.userRepo.findOne({
                    attributes: [["profile_image_url", "profileImageUrl"]],
                    where: { username: eachFriendRequest.sender },
                }),
            );
        });
        const profilePictureUrls: (string | undefined)[] = (
            await Promise.all(senderProfilePictures)
        ).map((eachUser: User | null) => {
            if (eachUser) {
                return eachUser.profileImageUrl;
            }
            return undefined;
        });

        const finalizedRequests = foundFriendRequests.map(
            (
                eachFoundFriendRequest: FriendRequest,
                _index: number,
            ): FriendRequestDTO => ({
                ...eachFoundFriendRequest.dataValues,
                senderProfileImageUrl: profilePictureUrls[_index],
            }),
        );

        return new ApiResponse(id, finalizedRequests);
    };

    /** @inheritdoc */
    public acceptRequest = async (
        id: string,
        usernameTo: string,
        usernameFrom: string,
    ): Promise<ApiResponse<boolean>> => {
        const doesFriendRequestExist = await this.doesFriendRequestExist(
            usernameTo,
            usernameFrom,
        );

        if (!doesFriendRequestExist) {
            return new ApiResponse(id, false);
        }

        const removeRequest = await this.psqlClient.friendRequestRepo.destroy({
            where: { sender: usernameFrom, username: usernameTo },
        });

        if (removeRequest === 0) {
            return new ApiResponse(id, false);
        }

        const addAsFriend = await this.psqlClient.friendRepo.create({
            accepted: Date.now(),
            recipient: usernameTo,
            sender: usernameFrom,
        });

        return new ApiResponse(id, Boolean(addAsFriend));
    };

    /** @inheritdoc */
    public rejectRequest = async (
        id: string,
        usernameTo: string,
        usernameFrom: string,
    ): Promise<ApiResponse<boolean>> => {
        const doesFriendRequestExist = await this.doesFriendRequestExist(
            usernameTo,
            usernameFrom,
        );

        if (!doesFriendRequestExist) {
            return new ApiResponse(id, false);
        }

        const destroyResult = await this.psqlClient.friendRequestRepo.destroy({
            where: { sender: usernameFrom, username: usernameTo },
        });

        return new ApiResponse(id, destroyResult > 0);
    };

    /** @inheritdoc */
    public removeFriend = async (
        id: string,
        recipient: string,
        sender: string,
    ): Promise<ApiResponse<boolean>> => {
        const doesFriendshipExist = await this.doesFriendshipExist(
            recipient,
            sender,
        );

        if (!doesFriendshipExist) {
            throw new Error("Friendship does not exist");
        }

        const removeResult = await this.psqlClient.friendRepo.destroy({
            where: {
                [Op.or]: [
                    { recipient, sender },
                    { recipient: sender, sender: recipient },
                ],
            },
        });

        return new ApiResponse(id, removeResult > 0);
    };

    /** @inheritdoc */
    public sendDirectMessage = async (
        id: string,
        receiver: string,
        sender: string,
        content: string,
        senderProfilePictureUrl?: string,
    ): Promise<ApiResponse<boolean>> => {
        const doesFriendshipExist = await this.doesFriendshipExist(
            receiver,
            sender,
        );

        if (!doesFriendshipExist) {
            throw new Error("Sender is not friends with receiver");
        }

        const messageResult = await this.psqlClient.messageRepo.create({
            content,
            receiver,
            sender,
            senderProfilePictureUrl,
        });

        return new ApiResponse(id, Boolean(messageResult));
    };
}
