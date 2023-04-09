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

    private readonly userTable: string = "BUCKLESUSER";

    /**
     * The name of the PSQL table this service points to
     */
    private readonly requestTable: string = "BUCKLESFRIENDREQUEST";

    /**
     * The name of the PSQL table that houses all confirmed friends
     */
    private readonly friendTable: string = "BUCKLESFRIENDS";

    /**
     * The name of the PSQL table that houses all block requests
     */
    private readonly blockedTable: string = "BUCKLESBLOCKED";

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
        const query = `SELECT username, sender FROM ${this.requestTable} WHERE username = '${usernameTo}' AND sender = '${usernameFrom}';`;

        const queryResult = await this.psqlClient.client.query(query);

        return queryResult.rowCount > 0;
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

        const createFriendRequestQuery = `INSERT INTO ${
            this.requestTable
        }(username, sender, sent${
            customMessage === undefined ? "" : ", custom_message"
        }) VALUES ('${usernameTo}', '${usernameFrom}', ${Date.now()}${
            customMessage === undefined ? "" : `, ${customMessage}`
        });`;

        const createFriendRequestQueryResult =
            await this.psqlClient.client.query(createFriendRequestQuery);

        return new ApiResponse(id, createFriendRequestQueryResult.rowCount > 0);
    };

    /** @inheritdoc */
    public availableFriends = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<string[]>> => {
        if (username === undefined) {
            return new ApiResponse(id, [] as string[]);
        }

        return new ApiResponse(id, [] as string[]);
    };
}
