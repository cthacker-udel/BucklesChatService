/* eslint-disable max-lines -- disabled */
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
import { DbUser } from "../../@types/user/DbUser";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { ApiErrorInfo } from "../../models/api/errorInfo/ApiErrorInfo";
import { ApiErrorCodes } from "../../constants/enums/ApiErrorCodes";
import { RedisService } from "../../services/redis/RedisService";
import { authToken } from "../../middleware/authtoken/authtoken";
import { sign } from "jsonwebtoken";
import { SessionToken } from "../../@types/encryption/SessionToken";
import { EncryptionService } from "../../services/encryption/EncryptionService";
import { EmailService } from "../../services/email/EmailService";
import { cookieKey } from "../../constants/cookie/cookieKey";
import { adminVerification } from "../../middleware/adminVerification/adminVerification";
import { ChangePasswordRequest } from "./DTO/ChangePasswordRequest";

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
     * Services used for encryption needs
     */
    private readonly encryptionService: EncryptionService;

    /**
     * Service used for email sending, validation, etc
     */
    private readonly sendgridService: EmailService;

    /**
     * No-arg constructor, whose purpose is to initialize the psql instance
     */
    public constructor(
        _mongoService: MongoService,
        _psqlService: PSqlService,
        _redisService: RedisService,
        _encryptionService: EncryptionService,
        _sendgridService: EmailService,
    ) {
        super(undefined, "user");
        this.loggerService = new LoggerService(_mongoService);
        this.mongoService = _mongoService;
        this.psqlClient = _psqlService;
        this.redisService = _redisService;
        this.encryptionService = _encryptionService;
        this.sendgridService = _sendgridService;

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
                    middleware: [authToken],
                },
                {
                    endpoint: "bulkDashboardInformation",
                    handler: this.bulkDashboardInformation,
                    middleware: [authToken],
                },
                {
                    endpoint: "details",
                    handler: this.details,
                    middleware: [authToken],
                },
                {
                    endpoint: "isEmailValid",
                    handler: this.isEmailValid,
                    middleware: [authToken],
                },
                {
                    endpoint: "confirmEmail",
                    handler: this.confirmEmail,
                    middleware: [authToken],
                },
                {
                    endpoint: "pingUserStateExpiration",
                    handler: this.pingUserStateExpiration,
                    middleware: [authToken],
                },
                {
                    endpoint: "clearThrottleKeys",
                    handler: this.clearCacheThrottleKeys,
                    middleware: [authToken, adminVerification],
                },
                {
                    endpoint: "loginDiagnostics",
                    handler: this.loginDiagnostics,
                },
            ],
            BucklesRouteType.GET,
        );
        super.addRoutes(
            [
                { endpoint: "signup", handler: this.signUp },
                { endpoint: "login", handler: this.login },
                { endpoint: "logout", handler: this.logout },
                {
                    endpoint: "flushCache",
                    handler: this.flushCache,
                    middleware: [authToken, adminVerification],
                },
                {
                    endpoint: "changePassword",
                    handler: this.changePassword,
                    middleware: [authToken],
                },
            ],
            BucklesRouteType.POST,
        );
        super.addRoutes(
            [
                { endpoint: "remove", handler: this.removeUser },
                {
                    endpoint: "clearUserState",
                    handler: this.clearUserState,
                    middleware: [authToken],
                },
                {
                    endpoint: "deleteUser",
                    handler: this.deleteUser,
                    middleware: [authToken],
                },
            ],
            BucklesRouteType.DELETE,
        );
        super.addRoutes(
            [
                { endpoint: "edit", handler: this.editUser },
                {
                    endpoint: "refreshUserState",
                    handler: this.refreshUserState,
                    middleware: [authToken],
                },
            ],
            BucklesRouteType.PUT,
        );

        super.setStatusFunction(() => {
            if (!this.psqlClient.connected) {
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
            this.encryptionService,
            this.redisService,
            this.sendgridService,
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

            if (username === undefined || username.length === 0) {
                throw new Error("Invalid username supplied");
            }

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
            const userPayload = request.body as Partial<DbUser>;
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
            const loginPayload = request.body as Partial<DbUser>;

            if (
                loginPayload.username === undefined ||
                loginPayload.password === undefined
            ) {
                throw new Error("Must supply username and password to login");
            }

            const { username } = loginPayload;
            const ip = request.ip;

            const [loginResult, userId] = await this.userService.login(
                id,
                loginPayload,
            );

            const { data } = loginResult;

            if (data === undefined) {
                throw new Error("Issue logging in");
            }

            const [isUsernameThrottled, usernameThrottledUntil] =
                await this.userService.evaluateThrottleStatus(
                    username,
                    "USERNAME",
                );
            const [isIpThrottled, ipThrottledUntil] =
                await this.userService.evaluateThrottleStatus(ip, "IP");

            loginResult.data!.loggedIn =
                loginResult.data!.loggedIn &&
                !isUsernameThrottled &&
                !isIpThrottled;
            loginResult.data!.lockedUntil =
                usernameThrottledUntil || ipThrottledUntil;

            // If it is a failed login
            if (
                data !== undefined &&
                !data.loggedIn &&
                !isIpThrottled &&
                !isUsernameThrottled
            ) {
                // increment throttle status if user is currently allowed to login
                await this.userService.incrementThrottleStatus(request.ip);
                await this.userService.incrementThrottleStatus(username);
            }

            response.status(loginResult.data?.loggedIn ?? false ? 200 : 400);
            if (data?.loggedIn ?? false) {
                response.cookie(
                    cookieKey,
                    sign(
                        { userId } as SessionToken,
                        process.env.TOKEN_SECRET as string,
                    ),
                );
            }

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
            const fromUserId =
                this.encryptionService.getUserIdFromRequest(request);

            if (fromUserId === undefined) {
                throw new Error("Must supply valid token");
            }

            const requestedUserId = request.query.id as string;

            if (requestedUserId === undefined) {
                throw new Error("Must supply user id to remove");
            }

            const deleteResponse = await this.userService.removeUser(
                id,
                fromUserId,
                Number.parseInt(requestedUserId, 10),
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
            const userId = this.encryptionService.getUserIdFromRequest(request);

            const {
                id: _,
                username: __,
                password: ___,
                passwordSalt: ____,
                ...rest
            } = request.body as Partial<DbUser>;

            if (Object.keys(rest).length === 0) {
                throw new Error("Must supply values to modify the entity");
            }

            const editResponse = await this.userService.editUser(
                id,
                userId,
                rest,
            );

            if (
                editResponse.data !== undefined &&
                editResponse.data &&
                rest.email !== undefined
            ) {
                // updated email, send confirmation email to confirm email
                await this.userService.sendConfirmationEmail(id, rest.email);
            }

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
            const totalUsersOnline = await this.userService.totalUsersOnline(
                id,
            );
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
            const userId = this.encryptionService.getUserIdFromRequest(request);

            const userDashboardInformation =
                await this.userService.dashboardInformation(id, userId);
            response.status(200);
            response.send(userDashboardInformation);
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
    public bulkDashboardInformation = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const usernames = (request.query.usernames as string).split(",");

            if (usernames.length === 0) {
                response.status(200);
                response.send([]);
            } else {
                const usersDashboardInformation =
                    await this.userService.bulkDashboardInformation(
                        id,
                        usernames,
                    );
                response.status(200);
                response.send(usersDashboardInformation);
            }
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
    public details = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const userId = this.encryptionService.getUserIdFromRequest(request);

            const userEditInformation = await this.userService.details(
                id,
                userId,
            );
            response.status(200);
            response.send(userEditInformation);
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
    public logout = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (userId === undefined) {
                throw new Error("Must supply user id to logout");
            }

            request.session.destroy(() => {});
            response.clearCookie("connect.sid");
            response.clearCookie(cookieKey);
            const didLogout = await this.userService.logout(
                id,
                userId,
                request.ip,
            );
            response.status(didLogout ? 200 : 400);
            response.send({ data: didLogout });
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
    public isEmailValid = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const email = request.query.email;

            if (email === undefined) {
                throw new Error("Must supply email to validate");
            }

            const result = await this.userService.isEmailValid(
                id,
                email as string,
            );
            response.status(200);
            response.setHeader("Cache-Control", [
                "max-age=180",
                "stale-while-revalidate=180",
            ]);
            response.send(result);
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
    public confirmEmail = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const confirmationToken = request.query.token;
            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (confirmationToken === undefined) {
                throw new Error(
                    "Must supply confirmation token if attempting to confirm email",
                );
            }

            if (userId === undefined) {
                throw new Error(
                    "Must supply user id in request when trying to confirm email",
                );
            }

            const validateEmailResponse = await this.userService.confirmEmail(
                id,
                userId,
                confirmationToken as string,
            );

            response.status(200);
            response.send(validateEmailResponse);
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
    public refreshUserState = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const userId = this.encryptionService.getUserIdFromRequest(request);

            const result = await this.userService.refreshUserState(id, userId);

            response.status(200);
            response.send(result);
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
    public pingUserStateExpiration = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const userId = this.encryptionService.getUserIdFromRequest(request);

            const result = await this.userService.expireTimeOfUserState(
                id,
                userId,
            );

            response.status(200);
            response.send(result);
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
    public clearUserState = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const userId = this.encryptionService.getUserIdFromRequest(request);

            const result = await this.userService.clearUserState(id, userId);

            response.status(200);
            response.send(result);
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
    public clearCacheThrottleKeys = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (userId === undefined) {
                throw new Error(
                    "Must supply user id when removing throttle keys",
                );
            }

            const clearThrottleKeysResult =
                await this.userService.clearThrottleKeys(
                    id,
                    userId,
                    request.ip,
                );

            const { data } = clearThrottleKeysResult;

            if (data === undefined) {
                throw new Error(
                    "No data to check if keys were removed successfully",
                );
            }

            response.status(data[0] && data[1] ? 200 : 500);
            response.send(clearThrottleKeysResult);
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
    public flushCache = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (userId === undefined) {
                throw new Error("Must supply user id to execute this action");
            }

            await this.loggerService.LogEvent(id, {
                id,
                message: `User ${userId} attempting to flush the cache`,
                timestamp: Date.now(),
                type: "ADMIN",
            });

            const result = await this.userService.flushCache(id);

            const { data: didFlush } = result;

            response.status(didFlush ?? false ? 200 : 400);
            response.send(result);
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
    public loginDiagnostics = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const loginDiagnostics = await this.userService.loginDiagnostics(
                id,
            );

            response.status(loginDiagnostics === undefined ? 500 : 200);
            response.send(loginDiagnostics);
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
    public changePassword = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (userId === null) {
                throw new Error("Must supply user id in request");
            }

            const requestedChangePassword = (
                request.body as ChangePasswordRequest
            ).newPassword;

            const result = await this.userService.changePassword(
                id,
                userId,
                requestedChangePassword,
                request.ip,
            );

            response.status(result?.data ?? false ? 200 : 400);
            response.send(result);
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
    public deleteUser = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (userId === undefined) {
                throw new Error("Must pass user id in request");
            }

            const result = await this.userService.deleteUser(
                id,
                userId,
                request.ip,
            );
            request.session.destroy(() => {});
            response.clearCookie("connect.sid");
            response.clearCookie(cookieKey);
            response.send(result);
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
}
