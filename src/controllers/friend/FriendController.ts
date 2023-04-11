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
import { SendFriendRequest } from "./DTO/SendFriendRequest";

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
            [{ endpoint: "sendRequest", handler: this.sendRequest }],
            BucklesRouteType.POST,
        );

        super.addRoutes(
            [
                {
                    endpoint: "availableFriends",
                    handler: this.availableFriends,
                },
                { endpoint: "pendingRequests", handler: this.pendingRequests },
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
                request.body as SendFriendRequest;
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
}
