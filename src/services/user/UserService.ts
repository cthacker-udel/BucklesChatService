/* eslint-disable implicit-arrow-linebreak -- disabled */

import { IUserService } from "./IUserService";
import { PSqlService } from "../psql/PSqlService";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { LoggerService } from "../logger/LoggerService";
import { User } from "../../@types/user/User";
import { EncryptionData } from "../psql/models/EncryptionData";
import { EncryptionService } from "../encryption/EncryptionService";
import { convertUserKeyToPsqlValue } from "../../helpers/api/convertUserKeyToPsqlValue";
import { PsqlUser } from "../../@types/user/PsqlUser";
import { RedisService } from "../redis/RedisService";
import { DashboardInformation } from "../../@types/user/DashboardInformation";
import { convertPartialPsqlUserToUser } from "../../helpers/api/convertPartialPsqlUserToUser";

export class UserService implements IUserService {
    /**
     * The PSQL client instance
     */
    private readonly psqlClient: PSqlService;

    /**
     * The name of the PSQL table this service points to
     */
    private readonly table: string = "BUCKLESUSER";

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
        const foundUserQuery = await this.psqlClient.client.query(
            `SELECT * FROM ${this.table} WHERE USERNAME = '${username}'`,
        );
        return new ApiResponse<boolean>(id).setData(
            foundUserQuery.rowCount > 0,
        );
    };

    /** @inheritdoc */
    public createUser = async (
        id: string,
        username: string,
        password: string,
        passwordSalt: string,
    ): Promise<ApiResponse<boolean>> => {
        const createUserResponse = await this.psqlClient.client.query(
            `INSERT INTO ${
                this.table
            }(username, password, password_salt, creation_date) VALUES ('${username}', '${password}', '${passwordSalt}', ${Date.now()});`,
        );
        return new ApiResponse<boolean>(id).setData(
            createUserResponse.rowCount > 0,
        );
    };

    /** @inheritdoc */
    public findUserEncryptionData = async (
        username: string,
    ): Promise<Partial<EncryptionData>> => {
        const foundUserEncryptionData = await this.psqlClient.client.query(
            `SELECT password_salt, password FROM ${this.table} WHERE username = '${username}';`,
        );

        if (foundUserEncryptionData.rowCount === 0) {
            throw new Error("Invalid username supplied");
        }

        return foundUserEncryptionData.rows[0] as EncryptionData;
    };

    /** @inheritdoc */
    public login = async (
        id: string,
        user: Partial<User>,
    ): Promise<ApiResponse<boolean>> => {
        const { username, password } = user;
        if (username === undefined || password === undefined) {
            throw new Error("Must supply proper credentials when logging in");
        }

        const foundEncryptedPasswordSalt = await this.findUserEncryptionData(
            username,
        );

        if (
            foundEncryptedPasswordSalt.password_salt === undefined ||
            foundEncryptedPasswordSalt.password === undefined
        ) {
            throw new Error("No encryption data available for user");
        }

        const fixedEncryptionResult =
            new EncryptionService().fixedValueEncryption(
                foundEncryptedPasswordSalt.password_salt,
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
        user: Partial<User>,
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

        const removalResult = await this.psqlClient.client.query(
            `DELETE FROM ${this.table} WHERE USERNAME = '${username}';`,
        );

        if (removalResult.rowCount === 0) {
            throw new Error("Unable to remove user");
        }

        return new ApiResponse(id, removalResult.rowCount > 0);
    };

    /** @inheritdoc */
    public editUser = async (
        id: string,
        username: string,
        userPayload: Partial<PsqlUser>,
    ): Promise<ApiResponse<boolean>> => {
        const isUsernameInTable = await this.doesUsernameExist(id, username);

        if (!(isUsernameInTable.data ?? false)) {
            throw new Error("Username does not exist in table");
        }

        const request = `UPDATE ${this.table} SET ${Object.keys(userPayload)
            .map(
                (eachKey) =>
                    `${eachKey.toLowerCase()} = ${convertUserKeyToPsqlValue(
                        eachKey,
                        (userPayload as { [key: string]: string })[eachKey],
                    )}`,
            )
            .join(", ")} WHERE USERNAME = '${username}';`;

        const updateResult = await this.psqlClient.client.query(request);
        return new ApiResponse(id, updateResult.rowCount > 0);
    };

    /** @inheritdoc */
    public usersOnline = async (id: string): Promise<ApiResponse<number>> =>
        new ApiResponse(id, await this.redisService.client.dbSize());

    /** @inheritdoc */
    public totalUsers = async (id: string): Promise<ApiResponse<number>> => {
        const queryResult = await this.psqlClient.client.query(
            `SELECT * FROM ${this.table}`,
        );
        return new ApiResponse(id, queryResult.rowCount);
    };

    /** @inheritdoc */
    public dashboardInformation = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<DashboardInformation>> => {
        const query = `SELECT handle, profile_image_url, creation_date FROM ${this.table} WHERE USERNAME = '${username}'`;
        const queryResult = await this.psqlClient.client.query(query);

        if (queryResult.rowCount === 0) {
            return new ApiResponse(id, {
                creationDate: 0,
                handle: undefined,
                profileImageUrl: undefined,
                username,
            } as DashboardInformation);
        }

        return new ApiResponse(id, {
            ...queryResult.rows[0],
            username,
        } as DashboardInformation);
    };

    /** @inheritdoc */
    public details = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<Partial<User>>> => {
        const query = `SELECT first_name, last_name, email, handle, dob FROM ${this.table} WHERE USERNAME = '${username}'`;

        const queryResult = await this.psqlClient.client.query(query);

        if (queryResult.rowCount === 0) {
            return new ApiResponse(id, {});
        }

        return new ApiResponse(
            id,
            convertPartialPsqlUserToUser(
                queryResult.rows[0] as Partial<PsqlUser>,
            ),
        );
    };
}
