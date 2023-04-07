/* eslint-disable @typescript-eslint/no-misused-promises -- disabled */
import { IUserController } from "./IUserController";

import { BaseController } from "../base/BaseController";
import { PSqlService } from "../../services/psql/PSqlService";
import { MongoService } from "../../services/mongo/MongoService";
import { Request, Response } from "express";
import { getIdFromRequest } from "../../helpers/api/getIdFromRequest";
import { UserService } from "../../services/user/UserService";
import { LoggerService } from "../../services/logger/LoggerService";
import { exceptionToExceptionLog } from "../../helpers/logger/exceptionToExceptionLog";
import { BucklesRouteType } from "../../constants/enums/BucklesRouteType";
import { User } from "../../@types/user/User";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { ApiErrorInfo } from "../../models/api/errorInfo/ApiErrorInfo";
import { ApiErrorCodes } from "../../constants/enums/ApiErrorCodes";
import { convertPartialUserToPsqlUser } from "../../helpers/api/convertPartialUserToPsqlUser";
import { RedisService } from "../../services/redis/RedisService";

export class UserController extends BaseController implements IUserController {
    /**
     * The internal psqlClient instance allowing for querying of the database
     */
    private readonly psqlClient: PSqlService;

    /**
     * Logger controller used for logging exceptions to the mongo database
     */
    private readonly loggerService: LoggerService;

    /**
     * Service used for calling logger controller methods
     */
    private readonly mongoService: MongoService;

    /**
     * Service used for accessing the redis database
     */
    private readonly redisService: RedisService;

    /**
     * Service used to handle all user operations in the database
     */
    private readonly userService: UserService;

    /**
     * No-arg constructor, whose purpose is to initialize the psql instance
     */
    public constructor(_mongoService: MongoService) {
        super(process.env.USER_TABLE, "user");
        this.loggerService = new LoggerService(_mongoService);
        this.mongoService = _mongoService;
        this.psqlClient = new PSqlService();
        this.redisService = new RedisService();

        super.addRoutes(
            [
                {
                    endpoint: "doesUsernameExist",
                    handler: this.doesUsernameExist,
                },
                {
                    endpoint: "usersOnline",
                    handler: this.usersOnline,
                },
                {
                    endpoint: "totalUsers",
                    handler: this.totalUsers,
                },
                {
                    endpoint: "dashboardInformation",
                    handler: this.dashboardInformation,
                },
            ],
            BucklesRouteType.GET,
        );
        super.addRoutes(
            [
                { endpoint: "signup", handler: this.signUp },
                { endpoint: "login", handler: this.login },
            ],
            BucklesRouteType.POST,
        );
        super.addRoutes(
            [{ endpoint: "remove", handler: this.removeUser }],
            BucklesRouteType.DELETE,
        );
        super.addRoutes(
            [{ endpoint: "edit", handler: this.editUser }],
            BucklesRouteType.PUT,
        );

        super.setStatusFunction(() => {
            if (this.psqlClient.client.database === undefined) {
                throw new Error("PSQL Client is not connected");
            }
            if (this.mongoService === undefined) {
                throw new Error("Mongo Client is not connected");
            }
            if (this.loggerService === undefined) {
                throw new Error("Logger Controller is not connected");
            }
        });
        this.userService = new UserService(
            this.psqlClient,
            this.loggerService,
            this.redisService,
        );
    }

    /** @inheritdoc */
    public doesUsernameExist = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const username = request.query.username as string;
            const usernameResponse = await this.userService.doesUsernameExist(
                id,
                username,
            );
            response.status((usernameResponse.data as boolean) ? 400 : 200);
            response.send(usernameResponse);
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            response.status(500);
            response.send(
                new ApiResponse(id).setApiError(
                    new ApiErrorInfo(id).initException(
                        error,
                        ApiErrorCodes.USERNAME_LOOKUP_ERROR,
                    ),
                ),
            );
        }
    };

    /** @inheritdoc */
    public signUp = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const userPayload = request.body as Partial<User>;
            const userCreationResponse = await this.userService.signUp(
                id,
                userPayload,
            );
            response.status((userCreationResponse.data as boolean) ? 200 : 500);
            response.send(userCreationResponse);
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            response.status(500);
            response.send(
                new ApiResponse(id).setApiError(
                    new ApiErrorInfo(id).initException(
                        error,
                        ApiErrorCodes.USERNAME_CREATION_FAILURE,
                    ),
                ),
            );
        }
    };

    /** @inheritdoc */
    public login = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const loginPayload = request.body as Partial<User>;
            const loginResult = await this.userService.login(id, loginPayload);
            response.status(loginResult.data ?? false ? 200 : 400);
            response.send(loginResult);
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            response.status(500);
            response.send(
                new ApiResponse(id).setApiError(
                    new ApiErrorInfo(id).initException(error),
                ),
            );
        }
    };

    /** @inheritdoc */
    public removeUser = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const { username } = request.body as Partial<User>;

            if (username === undefined) {
                throw new Error("Must supply username when removing user");
            }
            const deleteResponse = await this.userService.removeUser(
                id,
                username,
            );
            response.status(200);
            response.send(deleteResponse);
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            response.status(500);
            response.send(
                new ApiResponse(id).setApiError(
                    new ApiErrorInfo(id).initException(error),
                ),
            );
        }
    };

    /** @inheritdoc */
    public editUser = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const username = request.query.username as string;
            const {
                username: _,
                password: __,
                passwordSalt: ___,
                ...rest
            } = request.body as Partial<User>;

            if (Object.keys(rest).length === 0) {
                throw new Error("Must supply values to modify the entity");
            }

            const editResponse = await this.userService.editUser(
                id,
                username,
                convertPartialUserToPsqlUser(rest),
            );

            response.status(200);
            response.send(editResponse);
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            response.status(500);
            response.send(
                new ApiResponse(id).setApiError(
                    new ApiErrorInfo(id).initException(error),
                ),
            );
        }
    };

    /** @inheritdoc */
    public usersOnline = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const totalUsersOnline = await this.userService.usersOnline(id);
            response.status(200);
            response.send(totalUsersOnline);
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            response.status(500);
            response.send(
                new ApiResponse(id).setApiError(
                    new ApiErrorInfo(id).initException(error),
                ),
            );
        }
    };

    /** @inheritdoc */
    public totalUsers = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const totalUsers = await this.userService.totalUsers(id);
            response.status(200);
            response.send(totalUsers);
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            response.status(500);
            response.send(
                new ApiResponse(id).setApiError(
                    new ApiErrorInfo(id).initException(error),
                ),
            );
        }
    };

    /** @inheritdoc */
    public dashboardInformation = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const username = request.query.username as string;
            const userDashboardInformation =
                await this.userService.dashboardInformation(id, username);
            response.status(200);
            response.send(userDashboardInformation);
        } catch (error: unknown) {
            console.log(error);
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            response.status(500);
            response.send(
                new ApiResponse(id).setApiError(
                    new ApiErrorInfo(id).initException(error),
                ),
            );
        }
    };
}
