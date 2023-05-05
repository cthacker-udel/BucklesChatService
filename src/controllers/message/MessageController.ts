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
import { AddMessageToThreadPayload } from "./threadDTO/AddMessageToThreadPayload";
import { DirectMessagePayload } from "../friend/DTO/DirectMessagePayload";
import { ChatRoom } from "../../models/sequelize/ChatRoom";
import { addMessageToChatRoomDTO } from "./messageDTO/addMessageToChatRoomDTO";
import { authToken } from "../../middleware/authtoken/authtoken";
import { EncryptionService } from "../../services/encryption/EncryptionService";

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
     * Encryption service used for decoding tokens
     */
    private readonly encryptionService: EncryptionService;

    /**
     * 3-arg constructor, taking in instances of the necessary services to run functionally complete
     *
     * @param _mongoService - The mongodb service
     * @param _psqlService - The psql service
     */
    public constructor(
        _mongoService: MongoService,
        _psqlService: PSqlService,
        _encryptionService: EncryptionService,
    ) {
        super(undefined, "message");
        this.psqlClient = _psqlService;
        this.mongoService = _mongoService;
        this.loggerService = new LoggerService(_mongoService);
        this.messageService = new MessageService(this.psqlClient);
        this.encryptionService = _encryptionService;
        super.addRoutes(
            [
                {
                    endpoint: "thread/getAll",
                    handler: this.getThreads,
                    middleware: [authToken],
                },
                {
                    endpoint: "thread/messages",
                    handler: this.getThreadMessages,
                    middleware: [authToken],
                },
                {
                    endpoint: "thread/getAll/messages",
                    handler: this.getThreadsWithMessages,
                    middleware: [authToken],
                },
                {
                    endpoint: "pendingDirectMessages",
                    handler: this.pendingDirectMessages,
                    middleware: [authToken],
                },
                {
                    endpoint: "chatroom/all",
                    handler: this.getAllChatRooms,
                },
                {
                    endpoint: "chatroom/stats",
                    handler: this.getChatRoomStats,
                },
                {
                    endpoint: "chatroom/messages",
                    handler: this.getChatRoomMessages,
                },
            ],
            BucklesRouteType.GET,
        );
        super.addRoutes(
            [
                {
                    endpoint: "thread/create",
                    handler: this.createThread,
                    middleware: [authToken],
                },
                {
                    endpoint: "thread/addMessage",
                    handler: this.addMessageToThread,
                    middleware: [authToken],
                },
                {
                    endpoint: "add",
                    handler: this.addMessage,
                    middleware: [authToken],
                },
                {
                    endpoint: "chatroom/add",
                    handler: this.createChatRoom,
                    middleware: [authToken],
                },
                {
                    endpoint: "chatroom/add/message",
                    handler: this.addMessageToChatRoom,
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

        super.setStatusFunction(() => {
            if (!this.psqlClient.connected) {
                throw new Error("Psql client is not connected");
            }
            if (this.mongoService === undefined) {
                throw new Error("Mongo client is not connected");
            }
            if (this.loggerService === undefined) {
                throw new Error("Logger is not connected");
            }
        });
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
            if (threadPayload.receiver === undefined) {
                throw new Error("Must specify receiver when creating thread");
            }

            const creatorId =
                this.encryptionService.getUserIdFromRequest(request);

            if (creatorId === undefined) {
                throw new Error("Must supply valid token when creating thread");
            }

            if (creatorId === threadPayload.receiver) {
                throw new Error("Cannot create thread for yourself");
            }

            const { receiver } = threadPayload;

            const createThreadResult = await this.messageService.createThread(
                id,
                creatorId,
                receiver,
            );

            response.status(
                createThreadResult.data !== undefined &&
                    createThreadResult.data >= 0
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
            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (userId === undefined) {
                throw new Error(
                    "Must supply username when fetching threads that belong to user",
                );
            }

            const result = await this.messageService.getThreads(id, userId);

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

            if (body === undefined || body.threadId === undefined) {
                throw new Error(
                    "Must supply proper body when removing a thread",
                );
            }

            const { threadId } = body;

            const doesThreadExist =
                await this.messageService.doesThreadExistIdOnly(threadId);

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

    /** @inheritdoc */
    public addMessageToThread = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const body = request.body as AddMessageToThreadPayload;

            if (body.messageId === undefined || body.threadId === undefined) {
                throw new Error(
                    "Must supply message id and thread id when adding a message to a thread",
                );
            }

            const { messageId, threadId } = body;

            const result = await this.messageService.addMessageToThread(
                id,
                messageId,
                threadId,
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
    public getThreadMessages = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const threadId = request.query.threadId as string;

            if (threadId === undefined) {
                throw new Error(
                    "Thread id must be supplied to fetch messages of thread",
                );
            }

            const threadMessages = await this.messageService.getThreadMessages(
                id,
                Number.parseInt(threadId, 10),
            );

            response.status(200);
            response.send(threadMessages);
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
    public getThreadsWithMessages = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (userId === undefined) {
                throw new Error("Must supply user id to fetch thread data");
            }

            const threadsWithMessages =
                await this.messageService.getThreadsWithMessages(id, userId);

            response.status(200);
            response.send(threadsWithMessages);
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
    public addMessage = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const payload = request.body as DirectMessagePayload;
            payload.sender =
                this.encryptionService.getUserIdFromRequest(request);

            if (payload.content === undefined) {
                throw new Error(
                    "Must send necessary credentials to add a message",
                );
            }

            const result = await this.messageService.addMessage(id, payload);
            response.status(
                result?.data !== undefined && result.data >= 0 ? 200 : 400,
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

            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (userId === undefined) {
                throw new Error("Must supply user id in token");
            }

            const result = await this.messageService.pendingDirectMessages(
                id,
                userId,
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

    /** @inheritdoc */
    public createChatRoom = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const payload = request.body as Partial<ChatRoom>;

            payload.createdBy =
                this.encryptionService.getUserIdFromRequest(request);

            if (payload.createdBy === undefined || payload.name === undefined) {
                throw new Error(
                    "Must supply proper data when creating a chat room",
                );
            }

            const { createdBy, description, name } = payload;

            const createdChatRoomId = await this.messageService.createChatRoom(
                id,
                createdBy,
                name,
                description,
            );

            response.status(200);
            response.send(createdChatRoomId);
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
    public addMessageToChatRoom = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const convertedBody = request.body as addMessageToChatRoomDTO;

            if (
                convertedBody.chatRoomId === undefined ||
                convertedBody.messageId === undefined
            ) {
                throw new Error(
                    "Must include chatRoomId and messageId in payload when adding message to chat room",
                );
            }

            const { chatRoomId, messageId } = convertedBody;

            const addedMessageResponse =
                await this.messageService.addMessageToChatRoom(
                    id,
                    messageId,
                    chatRoomId,
                );

            response.status(200);
            response.send(addedMessageResponse);
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
    public getAllChatRooms = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const allChatRooms = await this.messageService.getAllChatRooms(id);

            response.status(200);
            response.send(allChatRooms);
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
    public getChatRoomStats = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const chatRoomId = request.query.chatRoomId;

            if (chatRoomId === undefined) {
                throw new Error("Must supply chat room id to retrieve stats");
            }

            const chatRoomStats = await this.messageService.getChatRoomStats(
                id,
                Number.parseInt(chatRoomId as string, 10),
            );

            response.status(200);
            response.send(chatRoomStats);
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
    public getChatRoomMessages = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const chatRoomId = request.query.id;

            if (chatRoomId === undefined) {
                throw new Error(
                    "Must supply valid id when attempting to access chat room messages",
                );
            }

            const allMessages = await this.messageService.getChatRoomMessages(
                id,
                Number.parseInt(chatRoomId as unknown as string, 10),
            );

            response.status(200);
            response.send(allMessages);
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

            const sender = this.encryptionService.getUserIdFromRequest(request);

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

            const result = await this.messageService.sendDirectMessage(
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
