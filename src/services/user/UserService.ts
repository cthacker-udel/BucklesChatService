import { IUserService } from "./IUserService";
import { PSqlService } from "../psql/PSqlService";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { ApiErrorInfo } from "../../models/api/errorInfo/ApiErrorInfo";
import { ApiErrorCodes } from "../../constants/enums/ApiErrorCodes";
import { LoggerService } from "../logger/LoggerService";
import { exceptionToExceptionLog } from "../../helpers/logger/exceptionToExceptionLog";
import { User } from "../../@types/user/User";

export class UserService implements IUserService {
    /**
     * The PSQL client instance
     */
    private readonly psqlClient: PSqlService;

    /**
     * The name of the PSQL table this service points to
     */
    private readonly table: string = "USER";

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
        try {
            const foundUserQuery = await this.psqlClient.client.query(
                `SELECT * FROM ${this.table} WHERE USERNAME = '${username}'`,
            );
            return new ApiResponse<boolean>(id).setData(
                foundUserQuery.rowCount > 0,
            );
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            return new ApiResponse<boolean>(id).setApiError(
                new ApiErrorInfo(id).initException(
                    error,
                    ApiErrorCodes.USERNAME_LOOKUP_ERROR,
                ),
            );
        }
    };

    /** @inheritdoc */
    public createUser = async (
        id: string,
        user: Partial<User>,
    ): Promise<ApiResponse<boolean>> => {
        try {
            const createUserResponse = await this.psqlClient.client.query(
                `INSERT INTO ${
                    this.table
                }(username, password, password_salt) VALUES (${
                    (user.username, user.password, user.passwordSalt)
                });`,
            );
            return new ApiResponse<boolean>(id).setData(
                createUserResponse.rowCount > 0,
            );
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            return new ApiResponse<boolean>(id).setApiError(
                new ApiErrorInfo(id).initException(
                    error,
                    ApiErrorCodes.USERNAME_CREATION_FAILURE,
                ),
            );
        }
    };
}
