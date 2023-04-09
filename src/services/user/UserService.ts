/* eslint-disable implicit-arrow-linebreak -- disabled */

import { IUserService } from "./IUserService";
import { PSqlService } from "../psql/PSqlService";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { LoggerService } from "../logger/LoggerService";
import { DbUser } from "../../@types/user/DbUser";
import { EncryptionService } from "../encryption/EncryptionService";
import { RedisService } from "../redis/RedisService";

export class UserService implements IUserService {
    /**
     * The PSQL client instance
     */
    private readonly psqlClient: PSqlService;

    /**
     * The name of the PSQL table this service points to
     */
    private readonly table: string = "BUCKLESUSERS";

    /**
     * The name of the PSQL table containing friend requests
     */
    private readonly friendRequestTable: string = "BUCKLESFRIENDREQUEST";

    /**
     * The LoggerService instance used for logging exceptions to the mongo database
     */
    private readonly loggerService: LoggerService;

    /**
     * The redis service instance used to access the database
     */
    private readonly redisService: RedisService;

    /**
     * Three-arg constructor, takes in a sql client used for interacting with the database that stores user information,
     * and takes in an LoggerService instance used for logging exceptions to the mongo database.
     *
     * @param _psqlClient - The psql client which is used to access user information
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
    public doesUsernameExist = async (id: string, username: string) => {
        const doesUserExist = await this.psqlClient.userRepo?.findOne({
            where: { username },
        });
        return new ApiResponse<boolean>(id).setData(Boolean(doesUserExist));
    };

    /** @inheritdoc */
    public createUser = async (
        id: string,
        username: string,
        password: string,
        passwordSalt: string,
    ): Promise<ApiResponse<boolean>> => {
        const createdUser = await this.psqlClient.userRepo?.create({
            password,
            passwordSalt,
            username,
        });

        return new ApiResponse<boolean>(id).setData(createdUser !== undefined);
    };

    /** @inheritdoc */
    public findUserEncryptionData = async (
        username: string,
    ): Promise<DbUser> => {
        const foundUserEncryptionData2 =
            await this.psqlClient.userRepo?.findOne({
                attributes: ["password_salt", "password"],
                where: { username },
            });

        console.log(foundUserEncryptionData2);

        if (!foundUserEncryptionData2) {
            throw new Error("Invalid username supplied");
        }

        return foundUserEncryptionData2.dataValues as DbUser;
    };

    /** @inheritdoc */
    public login = async (
        id: string,
        user: Partial<DbUser>,
    ): Promise<ApiResponse<boolean>> => {
        const { username, password } = user;
        if (username === undefined || password === undefined) {
            throw new Error("Must supply proper credentials when logging in");
        }

        const foundEncryptedPasswordSalt = await this.findUserEncryptionData(
            username,
        );

        if (
            foundEncryptedPasswordSalt.passwordSalt === undefined ||
            foundEncryptedPasswordSalt.password === undefined
        ) {
            throw new Error("No encryption data available for user");
        }

        const fixedEncryptionResult =
            new EncryptionService().fixedValueEncryption(
                foundEncryptedPasswordSalt.passwordSalt,
                password,
            );

        return new ApiResponse(
            id,
            fixedEncryptionResult === foundEncryptedPasswordSalt.password,
        );
    };

    /** @inheritdoc */
    public signUp = async (
        id: string,
        user: Partial<DbUser>,
    ): Promise<ApiResponse<boolean>> => {
        const { username, password } = user;

        if (username === undefined || password === undefined) {
            throw new Error("Must supply proper credentials when signing up");
        }

        const doesUsernameAlreadyExist = await this.doesUsernameExist(
            id,
            username,
        );

        if (doesUsernameAlreadyExist.data ?? false) {
            throw new Error("Username already exists");
        }

        const encryptionData = new EncryptionService().hmacEncrypt(password);

        if (
            encryptionData.hash === undefined ||
            encryptionData.salt === undefined
        ) {
            throw new Error("An error occurred, please try again.");
        }

        const createUserResult = await this.createUser(
            id,
            username,
            encryptionData.hash,
            encryptionData.salt,
        );

        return new ApiResponse(id, createUserResult.data ?? false);
    };

    /** @inheritdoc */
    public removeUser = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<boolean>> => {
        const isUsernameInTable = await this.doesUsernameExist(id, username);

        if (!(isUsernameInTable.data ?? true)) {
            throw new Error("Username is not present in database");
        }

        const removalResult = await this.psqlClient.userRepo?.destroy({
            where: { username },
        });

        if (removalResult === 0 || removalResult === undefined) {
            throw new Error("Unable to remove user");
        }

        return new ApiResponse(id, removalResult > 0);
    };

    /** @inheritdoc */
    public editUser = async (
        id: string,
        username: string,
        userPayload: DbUser,
    ): Promise<ApiResponse<boolean>> => {
        const isUsernameInTable = await this.doesUsernameExist(id, username);

        if (!(isUsernameInTable.data ?? false)) {
            throw new Error("Username does not exist in table");
        }

        const request = await this.psqlClient.userRepo?.update(userPayload, {
            where: { username },
        });

        if (request === undefined) {
            return new ApiResponse(id, false);
        }

        const numberAffected = request[0];

        return new ApiResponse(id, numberAffected > 0);
    };

    /** @inheritdoc */
    public usersOnline = async (id: string): Promise<ApiResponse<number>> =>
        new ApiResponse(id, await this.redisService.client.dbSize());

    /** @inheritdoc */
    public totalUsers = async (id: string): Promise<ApiResponse<number>> => {
        const total = await this.psqlClient.userRepo?.count();
        return new ApiResponse(id, total);
    };

    /** @inheritdoc */
    public dashboardInformation = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<DbUser>> => {
        const queryResult = await this.psqlClient.userRepo?.findOne({
            attributes: ["handle", "profile_image_url", "creation_date"],
            where: { username },
        });

        if (!queryResult) {
            return new ApiResponse(id);
        }

        return new ApiResponse(id, queryResult.dataValues as DbUser);
    };

    /** @inheritdoc */
    public details = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<DbUser>> => {
        const queryResult = await this.psqlClient.userRepo?.findOne({
            attributes: [
                "first_name",
                "last_name",
                "email",
                "handle",
                "dob",
                "username",
            ],
            where: { username },
        });

        if (!queryResult) {
            return new ApiResponse(id);
        }

        return new ApiResponse(id, queryResult.dataValues as DbUser);
    };
}
