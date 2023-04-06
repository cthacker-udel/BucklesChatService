import { IUserService } from "./IUserService";
import { PSqlService } from "../psql/PSqlService";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { LoggerService } from "../logger/LoggerService";
import { User } from "../../@types/user/User";
import { EncryptionData } from "../psql/models/EncryptionData";
import { EncryptionService } from "../encryption/EncryptionService";

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
     * Three-arg constructor, takes in a sql client used for interacting with the database that stores user information,
     * and takes in an LoggerService instance used for logging exceptions to the mongo database.
     *
     * @param _psqlClient
     * @param _loggerService
     */
    public constructor(
        _psqlClient: PSqlService,
        _loggerService: LoggerService,
    ) {
        this.psqlClient = _psqlClient;
        this.loggerService = _loggerService;
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
            `INSERT INTO ${this.table}(username, password, password_salt) VALUES ('${username}', '${password}', '${passwordSalt}');`,
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

        console.log("checking if username exists");

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

        console.log("creating user", encryptionData.hash, encryptionData.salt);

        const createUserResult = await this.createUser(
            id,
            username,
            encryptionData.hash,
            encryptionData.salt,
        );

        console.log("done creating user");

        return new ApiResponse(id, createUserResult.data ?? false);
    };
}
