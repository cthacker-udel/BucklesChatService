/* eslint-disable @typescript-eslint/no-misused-promises -- disabled */
/* eslint-disable @typescript-eslint/brace-style -- disabled */

import { Request, Response } from "express";
import { BucklesRouteType } from "../../constants/enums/BucklesRouteType";
import { getIdFromRequest } from "../../helpers/api/getIdFromRequest";
import { LoggerService } from "../../services/logger/LoggerService";
import { MongoService } from "../../services/mongo/MongoService";
import { PSqlService } from "../../services/psql/PSqlService";
import { RedisService } from "../../services/redis/RedisService";
import { BaseController } from "../base/BaseController";
import { IFriendController } from "./IFriendController";
import { FriendService } from "../../services/friend/FriendService";
import { exceptionToExceptionLog } from "../../helpers/logger/exceptionToExceptionLog";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { ApiErrorInfo } from "../../models/api/errorInfo/ApiErrorInfo";
import { FriendRequestPayload } from "./DTO/FriendRequestPayload";
import { FriendPayload } from "./DTO/FriendPayload";
import { DirectMessagePayload } from "./DTO/DirectMessagePayload";
import { authToken } from "../../middleware/authtoken/authtoken";
import { EncryptionService } from "../../services/encryption/EncryptionService";

export class FriendController
    extends BaseController
    implements IFriendController
{
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
     * Service used for accessing and updating data in the Friend tables
     */
    private readonly friendService: FriendService;

    /**
     * Service used for accessing and processing the token
     */
    private readonly encryptionService: EncryptionService;

    /**
     * No-arg constructor, whose purpose is to initialize the psql instance
     */
    public constructor(
        _mongoService: MongoService,
        _psqlService: PSqlService,
        _redisService: RedisService,
        _encryptionService: EncryptionService,
    ) {
        super(undefined, "friend");
        this.loggerService = new LoggerService(_mongoService);
        this.mongoService = _mongoService;
        this.psqlClient = _psqlService;
        this.redisService = _redisService;
        this.encryptionService = _encryptionService;

        super.addRoutes(
            [
                {
                    endpoint: "sendRequest",
                    handler: this.sendRequest,
                    middleware: [authToken],
                },
                {
                    endpoint: "acceptRequest",
                    handler: this.acceptRequest,
                    middleware: [authToken],
                },
                {
                    endpoint: "rejectRequest",
                    handler: this.rejectRequest,
                    middleware: [authToken],
                },
                {
                    endpoint: "removeFriend",
                    handler: this.removeFriend,
                    middleware: [authToken],
                },
                {
                    endpoint: "sendDirectMessage",
                    handler: this.sendDirectMessage,
                    middleware: [authToken],
                },
            ],
            BucklesRouteType.POST,
        );
        super.addRoutes(
            [
                {
                    endpoint: "availableFriends",
                    handler: this.availableFriends,
                    middleware: [authToken],
                },
                {
                    endpoint: "pendingRequests",
                    handler: this.pendingRequests,
                    middleware: [authToken],
                },
            ],
            BucklesRouteType.GET,
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

        this.friendService = new FriendService(
            this.psqlClient,
            this.loggerService,
            this.redisService,
        );
    }

    /** @inheritdoc */
    public availableFriends = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const userId =
                this.encryptionService.getUsernameFromRequest(request);
            const availableFriends = await this.friendService.availableFriends(
                id,
                userId,
            );
            response.status(200);
            response.send(availableFriends);
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
    public sendRequest = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const { customMessage, userTo } =
                request.body as FriendRequestPayload;
            const userFrom =
                this.encryptionService.getUsernameFromRequest(request);

            if (userFrom === undefined) {
                throw new Error(
                    "Must supply valid token to send friend request",
                );
            }

            if (userTo === undefined) {
                throw new Error(
                    "Must supply valid userTo when sending a friend request",
                );
            }

            const friendRequestResult = await this.friendService.sendRequest(
                id,
                userTo,
                userFrom,
                customMessage,
            );

            response.status(200);
            response.send(friendRequestResult);
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
    public pendingRequests = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const userId =
                this.encryptionService.getUsernameFromRequest(request);

            if (userId === undefined) {
                throw new Error("Must supply username");
            }

            const allPendingFriendRequests =
                await this.friendService.pendingRequests(id, userId);
            response.status(200);
            response.send(allPendingFriendRequests);
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
    public acceptRequest = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const requestPayload = request.body as FriendRequestPayload;

            const userTo =
                this.encryptionService.getUsernameFromRequest(request);

            if (requestPayload.userFrom === undefined) {
                throw new Error(
                    "Must supply username from when accepting request",
                );
            }

            const { userFrom } = requestPayload;

            const acceptResult = await this.friendService.acceptRequest(
                id,
                userTo,
                userFrom,
            );

            response.status(acceptResult.data === undefined ? 400 : 200);
            response.send(acceptResult);
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
    public rejectRequest = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const requestPayload = request.body as FriendRequestPayload;

            const userTo =
                this.encryptionService.getUsernameFromRequest(request);

            if (requestPayload.userFrom === undefined) {
                throw new Error(
                    "Unable to reject request, invalid username from sent",
                );
            }

            if (userTo === undefined) {
                throw new Error(
                    "Must supply valid token when rejecting request",
                );
            }

            const { userFrom } = requestPayload;

            const rejectResult = await this.friendService.rejectRequest(
                id,
                userTo,
                userFrom,
            );
            response.status(rejectResult.data === undefined ? 400 : 200);
            response.send(rejectResult);
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
    public removeFriend = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const requestPayload = request.body as FriendPayload;

            if (
                requestPayload.recipient === undefined ||
                requestPayload.sender === undefined
            ) {
                throw new Error(
                    "Must supply both usernames to remove a friend",
                );
            }

            const { recipient, sender } = requestPayload;

            const result = await this.friendService.removeFriend(
                id,
                recipient,
                sender,
            );
            response.status(
                result.data !== undefined && result.data ? 200 : 400,
            );
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
    public sendDirectMessage = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const directMessagePayload = request.body as DirectMessagePayload;

            const sender =
                this.encryptionService.getUsernameFromRequest(request);

            if (
                directMessagePayload.receiver === undefined ||
                directMessagePayload.content === undefined
            ) {
                throw new Error(
                    "Must provide valid fields when sending direct message",
                );
            }

            if (sender === undefined) {
                throw new Error(
                    "Must supply token when making request to send direct message",
                );
            }

            const { content, receiver } = directMessagePayload;

            const result = await this.friendService.sendDirectMessage(
                id,
                receiver,
                sender,
                content,
            );

            response.status(
                result.data !== undefined && result.data ? 200 : 400,
            );
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
