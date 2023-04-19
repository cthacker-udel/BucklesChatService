/* eslint-disable @typescript-eslint/no-misused-promises -- disabled */
/* eslint-disable @typescript-eslint/brace-style -- disabled */
import { Request, Response } from "express";
import { exceptionToExceptionLog } from "../../helpers/logger/exceptionToExceptionLog";
import { LoggerService } from "../../services/logger/LoggerService";
import { MessageService } from "../../services/message/MessageService";
import { MongoService } from "../../services/mongo/MongoService";
import { PSqlService } from "../../services/psql/PSqlService";
import { BaseController } from "../base/BaseController";
import { IMessageController } from "./IMessageController";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { ApiErrorInfo } from "../../models/api/errorInfo/ApiErrorInfo";
import { getIdFromRequest } from "../../helpers/api/getIdFromRequest";
import { CreateThreadPayload } from "./threadDTO/CreateThreadPayload";
import { BucklesRouteType } from "../../constants/enums/BucklesRouteType";
import { RemoveThreadPayload } from "./threadDTO/RemoveThreadPayload";

export class MessageController
    extends BaseController
    implements IMessageController
{
    /**
     * The internal psqlClient instance allowing for querying of the database
     */
    private readonly psqlClient: PSqlService;

    /**
     * Service used for calling logger controller methods
     */
    private readonly mongoService: MongoService;

    /**
     * Logger controller used for logging exceptions to the mongo database
     */
    private readonly loggerService: LoggerService;

    /**
     * Service used for accessing and updating data in tables related to messaging
     */
    private readonly messageService: MessageService;

    /**
     * 3-arg constructor, taking in instances of the necessary services to run functionally complete
     *
     * @param _mongoService - The mongodb service
     * @param _psqlService - The psql service
     */
    public constructor(_mongoService: MongoService, _psqlService: PSqlService) {
        super(undefined, "message");
        this.psqlClient = _psqlService;
        this.mongoService = _mongoService;
        this.loggerService = new LoggerService(_mongoService);
        this.messageService = new MessageService(this.psqlClient);
        super.addRoutes(
            [{ endpoint: "thread/getAll", handler: this.getThreads }],
            BucklesRouteType.GET,
        );
        super.addRoutes(
            [{ endpoint: "thread/create", handler: this.createThread }],
            BucklesRouteType.POST,
        );
    }

    /** @inheritdoc */
    public createThread = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const threadPayload = request.body as CreateThreadPayload;
            if (
                threadPayload.creator === undefined ||
                threadPayload.receiver === undefined
            ) {
                throw new Error(
                    "Must specify creator and receiver when creating thread",
                );
            }

            if (threadPayload.creator === threadPayload.receiver) {
                throw new Error("Cannot create thread for yourself");
            }

            const { creator, receiver } = threadPayload;

            const createThreadResult = await this.messageService.createThread(
                id,
                creator,
                receiver,
            );

            response.status(
                createThreadResult.data !== undefined && createThreadResult.data
                    ? 200
                    : 400,
            );
            response.send(createThreadResult);
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
    public getThreads = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const username = request.query.username as string;

            if (username === undefined) {
                throw new Error(
                    "Must supply username when fetching threads that belong to user",
                );
            }

            const result = await this.messageService.getThreads(id, username);

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
    public removeThread = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const body = request.body as RemoveThreadPayload;

            if (
                body === undefined ||
                body.threadId === undefined ||
                body.receiver === undefined ||
                body.sender === undefined
            ) {
                throw new Error(
                    "Must supply proper body when removing a thread",
                );
            }

            const { threadId, receiver, sender } = body;

            const doesThreadExist = await this.messageService.doesThreadExist(
                receiver,
                sender,
            );

            if (!doesThreadExist) {
                throw new Error("Thread does not exist");
            }

            const result = await this.messageService.removeThread(id, threadId);
            response.status(
                result?.data !== undefined && result.data ? 200 : 400,
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