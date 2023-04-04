import { IUserController } from "./IUserController";
import { LoggerController } from "../logger/LoggerController";

import { BaseController } from "../base/BaseController";
import { PSqlService } from "src/services/psql/PSqlService";
import { MongoService } from "src/services/mongo/MongoService";
import { ApiResponse } from "src/models/api/response/ApiResponse";
import { exceptionToExceptionLog } from "src/helpers/logger/exceptionToExceptionLog";
import { ApiErrorInfo } from "src/models/api/errorInfo/ApiErrorInfo";
import { ApiErrorCodes } from "src/constants/enums/ApiErrorCodes";

export class UserController extends BaseController implements IUserController {
    /**
     * The internal psqlClient instance allowing for querying of the database
     */
    private readonly psqlClient: PSqlService;

    /**
     * Logger controller used for logging exceptions to the mongo database
     */
    private readonly loggerController: LoggerController;

    /**
     * Service used for calling logger controller methods
     */
    private readonly mongoService: MongoService;

    /**
     * No-arg constructor, whose purpose is to initialize the psql instance
     */
    public constructor(
        _loggerController: LoggerController,
        _mongoService: MongoService,
    ) {
        super(process.env.USER_TABLE, "user");
        this.loggerController = _loggerController;
        this.mongoService = _mongoService;
        this.psqlClient = new PSqlService();
        this.psqlClient
            .init()
            .then((_) => {
                console.log("Successfully connected to the psql instance!");
            })
            .catch((error: unknown) => {
                console.error(
                    `Failed to connect to the Psql instance! ${
                        (error as Error).message
                    }`,
                );
            });
    }

    /** @inheritdoc */
    public doesUsernameExist = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<boolean>> => {
        try {
            const foundUserQuery = await this.psqlClient.client.query(
                `SELECT * FROM ${this.table} WHERE USERNAME = '${username}'`,
            );
            return new ApiResponse<boolean>(id).setData(
                foundUserQuery.rowCount > 0,
            );
        } catch (error: unknown) {
            await this.loggerController.LogException(
                id,
                this.mongoService,
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
}
