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
     * No-arg constructor, whose purpose is to initialize the psql instance
     */
    public constructor(
        _mongoService: MongoService,
        _psqlService: PSqlService,
        _redisService: RedisService,
    ) {
        super(undefined, "friend");
        this.loggerService = new LoggerService(_mongoService);
        this.mongoService = _mongoService;
        this.psqlClient = _psqlService;
        this.redisService = _redisService;

        super.addRoutes(
            [
                { endpoint: "sendRequest", handler: this.sendRequest },
                { endpoint: "acceptRequest", handler: this.acceptRequest },
                { endpoint: "rejectRequest", handler: this.rejectRequest },
                { endpoint: "removeFriend", handler: this.removeFriend },
                {
                    endpoint: "sendDirectMessage",
                    handler: this.sendDirectMessage,
                },
            ],
            BucklesRouteType.POST,
        );
        super.addRoutes(
            [
                {
                    endpoint: "availableFriends",
                    handler: this.availableFriends,
                },
                { endpoint: "pendingRequests", handler: this.pendingRequests },
                {
                    endpoint: "pendingDirectMessages",
                    handler: this.pendingDirectMessages,
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
            const username = request.query.username as string;
            const availableFriends = await this.friendService.availableFriends(
                id,
                username,
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
            const { customMessage, usernameTo, usernameFrom } =
                request.body as FriendRequestPayload;
            const friendRequestResult = await this.friendService.sendRequest(
                id,
                usernameTo,
                usernameFrom,
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
            const username = request.query.username;

            if (username === undefined) {
                throw new Error("Must supply username");
            }

            const allPendingFriendRequests =
                await this.friendService.pendingRequests(
                    id,
                    username as unknown as string,
                );
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
            if (
                requestPayload.usernameTo === undefined ||
                requestPayload.usernameFrom === undefined
            ) {
                throw new Error("Must supply both usernames to accept request");
            }

            const { usernameTo, usernameFrom } = requestPayload;

            const acceptResult = await this.friendService.acceptRequest(
                id,
                usernameTo,
                usernameFrom,
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

            if (
                requestPayload.usernameTo === undefined ||
                requestPayload.usernameFrom === undefined
            ) {
                throw new Error(
                    "Unable to reject request, invalid usernames sent",
                );
            }

            const { usernameTo, usernameFrom } = requestPayload;

            const rejectResult = await this.friendService.rejectRequest(
                id,
                usernameTo,
                usernameFrom,
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

            if (
                directMessagePayload.receiver === undefined ||
                directMessagePayload.sender === undefined ||
                directMessagePayload.content === undefined
            ) {
                throw new Error(
                    "Must provide valid fields when sending direct message",
                );
            }

            const { content, receiver, sender, senderProfilePictureURL } =
                directMessagePayload;

            const result = await this.friendService.sendDirectMessage(
                id,
                receiver,
                sender,
                content,
                senderProfilePictureURL,
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
    public pendingDirectMessages = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const username = request.query.username as string;

            if (username === undefined) {
                throw new Error("Must supply username");
            }

            const result = await this.friendService.pendingDirectMessages(
                id,
                username,
            );

            response.status(result.data === undefined ? 400 : 200);
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
