/* eslint-disable @typescript-eslint/indent -- disabled */
/* eslint-disable implicit-arrow-linebreak -- disabled */

import { Op } from "@sequelize/core";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { Thread } from "../../models/sequelize/Thread";
import { PSqlService } from "../psql/PSqlService";
import { IMessageService } from "./IMessageService";
import { Message } from "../../models/sequelize/Message";
import { ThreadMessage } from "../../@types/message/ThreadMessage";
import { ThreadWithMessages } from "../../@types/message/ThreadWithMessages";
import { User } from "../../models/sequelize/User";
import { DirectMessagePayload } from "../../controllers/friend/DTO/DirectMessagePayload";
import { ChatRoom } from "../../models/sequelize/ChatRoom";
import { ChatRoomStats } from "../../controllers/message/chatroomDTO/ChatRoomStats";
import { ChatRoomMessage } from "../../@types/message/ChatRoomMessage";

export class MessageService implements IMessageService {
    /**
     * The PSQL client instance
     */
    private readonly psqlClient: PSqlService;

    /**
     * 1-arg constructor, instances of all necessary services are passed in
     *
     * @param _psqlService - The psql service
     */
    constructor(_psqlService: PSqlService) {
        this.psqlClient = _psqlService;
    }

    /** @inheritdoc */
    public doesThreadExist = async (
        creatorId: number,
        receiverId: number,
    ): Promise<boolean> => {
        const doesExist = await this.psqlClient.threadRepo.findOne({
            where: { creator: creatorId, receiver: receiverId },
        });
        return doesExist !== null;
    };

    /** @inheritdoc */
    public doesThreadExistIdOnly = async (
        threadId: number,
    ): Promise<boolean> => {
        const doesExist = await this.psqlClient.threadRepo.findOne({
            where: { id: threadId },
        });
        return doesExist !== null;
    };

    /** @inheritdoc */
    public doesFriendshipExist = async (
        recipient: number,
        sender: number,
    ): Promise<boolean> => {
        const doesFriendshipExist = await this.psqlClient.friendRepo.findOne({
            where: {
                [Op.or]: [
                    { recipient, sender },
                    { recipient: sender, sender: recipient },
                ],
            },
        });

        return doesFriendshipExist !== null;
    };

    /** @inheritdoc */
    public createThread = async (
        id: string,
        creatorUserId: number,
        receiverUserId: number,
    ): Promise<ApiResponse<number>> => {
        const doesThreadAlreadyExist = await this.doesThreadExist(
            creatorUserId,
            receiverUserId,
        );

        if (doesThreadAlreadyExist) {
            return new ApiResponse(id, -1);
        }

        const createResult = await this.psqlClient.threadRepo.create({
            creator: creatorUserId,
            receiver: receiverUserId,
        });

        return new ApiResponse(id, createResult.dataValues.id);
    };

    /** @inheritdoc */
    public getThreads = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<Thread[]>> => {
        const allThreads = await this.psqlClient.threadRepo.findAll({
            where: {
                [Op.or]: [{ creator: userId }, { receiver: userId }],
            },
        });
        return new ApiResponse(id, allThreads);
    };

    /** @inheritdoc */
    public removeThread = async (
        id: string,
        threadId: number,
    ): Promise<ApiResponse<boolean>> => {
        const allMessagesRelatedToThread =
            await this.psqlClient.messageRepo.findAll({
                where: { thread: threadId },
            });

        const deleteRequests: Promise<number>[] = [];
        allMessagesRelatedToThread.forEach((eachMessage: Message) => {
            deleteRequests.push(
                this.psqlClient.messageRepo.destroy({
                    where: { id: eachMessage.id },
                }),
            );
        });

        const result = await Promise.all(deleteRequests);

        const threadRemoval = await this.psqlClient.threadRepo.destroy({
            where: { id: threadId },
        });

        return new ApiResponse<boolean>(
            id,
            result.every((eachDeletionResult) => eachDeletionResult > 0) &&
                threadRemoval > 0,
        );
    };

    /** @inheritdoc */
    public addMessageToThread = async (
        id: string,
        messageId: number,
        threadId: number,
    ): Promise<ApiResponse<boolean>> => {
        /**
         * Checks if the thread exists
         */
        const doesThreadExist = await this.doesThreadExistIdOnly(threadId);

        if (doesThreadExist === null) {
            return new ApiResponse<boolean>(id, false);
        }

        /**
         * Gets all messages belonging to the thread currently
         */
        const allThreadMessages = await this.psqlClient.messageRepo.findAll({
            where: { thread: threadId },
        });

        /**
         * Calculates the new thread order that this message will be assigned to
         */
        const newThreadOrder =
            allThreadMessages.length > 0
                ? Math.max(
                      ...allThreadMessages.map(
                          (eachMessage) =>
                              eachMessage.dataValues.threadOrder ?? 0,
                      ),
                  ) + 1
                : 1;

        /**
         * Checks if the message exists, has to exist to be able to be added to the thread
         */
        const doesMessageExist = await this.psqlClient.messageRepo.findOne({
            where: { id: messageId },
        });

        /**
         * If null then does not exist
         */
        if (doesMessageExist === null) {
            return new ApiResponse<boolean>(id, false);
        }

        /**
         * Update the message with new threadId and new threadOrder
         */
        const [updated] = await this.psqlClient.messageRepo.update(
            { thread: threadId, threadOrder: newThreadOrder },
            { where: { id: messageId } },
        );

        return new ApiResponse<boolean>(id, updated > 0);
    };

    /** @inheritdoc */
    public getThreadMessages = async (
        id: string,
        threadId: number,
    ): Promise<ApiResponse<ThreadMessage[]>> => {
        const doesThreadExist = await this.doesThreadExistIdOnly(threadId);

        if (!doesThreadExist) {
            return new ApiResponse(id, [] as ThreadMessage[]);
        }

        const allThreadMessages = await this.psqlClient.messageRepo.findAll({
            order: [["thread_order", "ASC"]],
            where: { thread: threadId },
        });

        const convertedThreadMessages = allThreadMessages.map(
            (eachThreadMessage: Message) => eachThreadMessage as ThreadMessage,
        );

        return new ApiResponse(id, convertedThreadMessages);
    };

    /** @inheritdoc */
    public findSenderProfilePictureUrl = async (
        _id: string,
        userId: number,
    ): Promise<string | undefined> => {
        const result = await this.psqlClient.userRepo.findOne({
            attributes: [["profile_image_url", "profileImageUrl"]],
            where: { id: userId },
        });

        return result?.profileImageUrl ?? undefined;
    };

    /** @inheritdoc */
    public getThreadsWithMessages = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<ThreadWithMessages[]>> => {
        const allThreads = await this.psqlClient.threadRepo.findAll({
            attributes: ["id", "receiver", "creator"],
            order: [["created_at", "DESC"]],
            where: {
                [Op.or]: [{ creator: userId }, { receiver: userId }],
            },
        });

        const allUserProfileImagesPromises: Promise<User | null>[] = [];
        const recordedUserIds = new Set<number>();

        allThreads.forEach((eachThread: Thread | null) => {
            if (eachThread !== null) {
                if (!recordedUserIds.has(eachThread.creator)) {
                    allUserProfileImagesPromises.push(
                        this.psqlClient.userRepo.findOne({
                            attributes: [
                                "id",
                                ["profile_image_url", "profileImageUrl"],
                                "username",
                            ],
                            where: { id: eachThread.creator },
                        }),
                    );
                    recordedUserIds.add(eachThread.creator);
                }
                if (!recordedUserIds.has(eachThread.receiver)) {
                    allUserProfileImagesPromises.push(
                        this.psqlClient.userRepo.findOne({
                            attributes: [
                                "id",
                                ["profile_image_url", "profileImageUrl"],
                                "username",
                            ],
                            where: { id: eachThread.receiver },
                        }),
                    );
                }
            }
        });

        const allUserProfileImages = await Promise.all(
            allUserProfileImagesPromises,
        );

        const allUserProfileImagesMap: { [key: number]: string | undefined } =
            {};

        const allUserUsernameMap: { [key: number]: string } = {};

        allUserProfileImages.forEach((eachUser: User | null) => {
            if (eachUser !== null) {
                allUserProfileImagesMap[eachUser.id as number] =
                    eachUser.profileImageUrl;
                allUserUsernameMap[eachUser.id as number] = eachUser.username;
            }
        });

        const messages: Promise<Message[]>[] = [];

        allThreads.forEach((eachThread: Thread | null) => {
            if (eachThread !== null) {
                messages.push(
                    this.psqlClient.messageRepo.findAll({
                        attributes: [
                            "sender",
                            "receiver",
                            "content",
                            "thread",
                            ["thread_order", "threadOrder"],
                            ["created_at", "createdAt"],
                            ["updated_at", "updatedAt"],
                        ],
                        order: [
                            ["thread_order", "ASC"],
                            ["thread", "ASC"],
                        ],
                        where: {
                            thread: eachThread.id,
                        },
                    }),
                );
            }
        });

        const allThreadsMessages = await Promise.all(messages);

        const amalgamatedThreadsWithMessages: ThreadWithMessages[] = new Array(
            allThreadsMessages.length,
        )
            .fill(0)
            .map(
                (_, index: number) =>
                    ({
                        creator: allThreads[index].creator,
                        creatorProfilePictureUrl:
                            allUserProfileImagesMap[allThreads[index].creator],
                        creatorUsername:
                            allUserUsernameMap[allThreads[index].creator],
                        messages: allThreadsMessages[index].map(
                            (eachMessage: Message | null) =>
                                ({
                                    ...eachMessage?.dataValues,
                                    senderProfilePictureUrl:
                                        allUserProfileImagesMap[
                                            eachMessage!.sender
                                        ],
                                    thread: allThreads[index].id,
                                } as ThreadMessage),
                        ),
                        receiver: allThreads[index].receiver,
                        receiverProfilePictureUrl:
                            allUserProfileImagesMap[allThreads[index].receiver],
                        receiverUsername:
                            allUserUsernameMap[allThreads[index].receiver],
                        threadId: allThreads[index].id,
                    } as ThreadWithMessages),
            );

        return new ApiResponse(id, amalgamatedThreadsWithMessages);
    };

    /** @inheritdoc */
    public addMessage = async (
        id: string,
        payload: DirectMessagePayload,
    ): Promise<ApiResponse<number>> => {
        const addMessageResult = await this.psqlClient.messageRepo.create({
            ...(payload as DirectMessagePayload & { sender: number }),
        });

        if (addMessageResult === null) {
            return new ApiResponse(id, -1);
        }

        return new ApiResponse(id, addMessageResult.id);
    };

    /** @inheritdoc */
    public pendingDirectMessages = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<DirectMessagePayload[]>> => {
        const pendingMessages = await this.psqlClient.messageRepo.findAll({
            where: { receiver: userId },
        });

        const filteredPendingMessages = pendingMessages.filter(
            (eachPendingMessage) => eachPendingMessage.thread === null,
        );

        const senderProfilePictures: Promise<User | null>[] = [];

        for (const eachPendingMessage of filteredPendingMessages) {
            senderProfilePictures.push(
                this.psqlClient.userRepo.findOne({
                    attributes: [["profile_image_url", "profileImageUrl"]],
                    where: { id: eachPendingMessage.sender },
                }),
            );
        }

        const allSenderProfilePictures = await Promise.all(
            senderProfilePictures,
        );

        const filteredAllSenderProfilePictures = allSenderProfilePictures.map(
            (eachUser) => eachUser?.profileImageUrl ?? null,
        );

        const convertedMessages = filteredPendingMessages.map(
            (eachResult: Message, index: number) =>
                ({
                    ...eachResult.dataValues,
                    senderProfilePictureUrl:
                        filteredAllSenderProfilePictures[index],
                } as DirectMessagePayload),
        );

        return new ApiResponse(id, convertedMessages);
    };

    /** @inheritdoc */
    public createChatRoom = async (
        id: string,
        createdBy: number,
        name: string,
        description?: string,
    ): Promise<ApiResponse<number>> => {
        const createdByUser = await this.psqlClient.userRepo.findOne({
            where: { id: createdBy },
        });

        if (createdByUser?.id === undefined) {
            return new ApiResponse(id, -1);
        }

        const createdChatRoom = await this.psqlClient.chatRoomRepo.create({
            createdBy: createdByUser.id,
            description,
            name,
        });

        if (createdChatRoom === null) {
            return new ApiResponse(id, -1);
        }

        return new ApiResponse(id, createdChatRoom.id);
    };

    /** @inheritdoc */
    public addMessageToChatRoom = async (
        id: string,
        messageId: number,
        chatRoomId: number,
    ): Promise<ApiResponse<Partial<ChatRoomMessage>>> => {
        const [updatedCount] = await this.psqlClient.messageRepo.update(
            { chatRoom: chatRoomId },
            { where: { id: messageId } },
        );

        if (updatedCount === 0) {
            return new ApiResponse(id, {});
        }

        const foundMessage = await this.psqlClient.messageRepo.findOne({
            where: { id: messageId },
        });

        if (foundMessage === null) {
            return new ApiResponse(id, {});
        }

        const foundUser = await this.psqlClient.userRepo.findOne({
            where: { id: foundMessage.sender },
        });

        if (foundUser === null) {
            return new ApiResponse(id, {});
        }

        const { profileImageUrl: senderProfilePictureUrl } = foundUser;

        const { content, createdAt, sender } = foundMessage;

        return new ApiResponse(id, {
            content,
            createdAt,
            sender,
            senderProfilePictureUrl,
        } as Partial<ChatRoomMessage>);
    };

    /** @inheritdoc */
    public getAllChatRooms = async (
        id: string,
    ): Promise<ApiResponse<ChatRoom[]>> => {
        const allChatRooms = await this.psqlClient.chatRoomRepo.findAll();

        return new ApiResponse(id, allChatRooms);
    };

    /** @inheritdoc */
    public getChatRoomStats = async (
        id: string,
        chatRoomId: number,
    ): Promise<ApiResponse<ChatRoomStats>> => {
        const allFoundMessages = await this.psqlClient.messageRepo.findAll({
            order: [["created_at", "ASC"]],
            where: { chatRoom: chatRoomId },
        });

        const lastUpdate =
            allFoundMessages.length > 0
                ? allFoundMessages.slice(-1)[0].dataValues.createdAt
                : undefined;

        const numberOfMessages = allFoundMessages.length;

        const usersSet = new Set<number>();

        allFoundMessages.forEach((eachMessage: Message) => {
            if (!usersSet.has(eachMessage.sender)) {
                usersSet.add(eachMessage.sender);
            }
        });

        const numberOfUsers = usersSet.size;

        return new ApiResponse(id, {
            lastUpdate,
            numberOfMessages,
            numberOfUsers,
        } as ChatRoomStats);
    };

    /** @inheritdoc */
    public getChatRoomMessages = async (
        id: string,
        chatRoomId: number,
    ): Promise<ApiResponse<ChatRoomMessage[]>> => {
        const allChatRoomMessages = await this.psqlClient.messageRepo.findAll({
            order: [["created_at", "ASC"]],
            where: { chatRoom: chatRoomId },
        });

        const senderProfilePicturesPromises: Promise<User | null>[] = [];

        allChatRoomMessages.forEach((eachMessage: Message) => {
            senderProfilePicturesPromises.push(
                this.psqlClient.userRepo.findOne({
                    attributes: [["profile_image_url", "profileImageUrl"]],
                    where: { id: eachMessage.sender },
                }),
            );
        });

        const senderProfilePictureResponses = await Promise.all(
            senderProfilePicturesPromises,
        );

        const senderProfilePictures: (string | undefined)[] =
            senderProfilePictureResponses.map(
                (eachSender) => eachSender?.profileImageUrl,
            );

        const convertedMessages: ChatRoomMessage[] = allChatRoomMessages.map(
            (eachMessage: Message, eachMessageIndex: number) => {
                const { content, createdAt, sender } = eachMessage;
                return {
                    content,
                    createdAt,
                    sender,
                    senderProfilePictureUrl:
                        senderProfilePictures[eachMessageIndex],
                };
            },
        );

        return new ApiResponse(id, convertedMessages);
    };

    /** @inheritdoc */
    public sendDirectMessage = async (
        id: string,
        receiver: number,
        sender: number,
        content: string,
    ): Promise<ApiResponse<boolean>> => {
        const receiverUser = await this.psqlClient.userRepo.findOne({
            where: { id: receiver },
        });

        const senderUser = await this.psqlClient.userRepo.findOne({
            where: { id: sender },
        });

        if (receiverUser?.id === undefined || senderUser?.id === undefined) {
            return new ApiResponse(id, false);
        }

        const doesFriendshipExist = await this.doesFriendshipExist(
            receiver,
            sender,
        );

        if (!doesFriendshipExist) {
            throw new Error("Sender is not friends with receiver");
        }

        const [createdOrFoundThread, _threadCreated] =
            await this.psqlClient.threadRepo.findOrCreate({
                defaults: {
                    creator: senderUser.id,
                    receiver: receiverUser.id,
                },
                where: {
                    [Op.or]: [
                        { creator: senderUser.id, receiver: receiverUser.id },
                        { creator: receiverUser.id, receiver: senderUser.id },
                    ],
                },
            });

        const messageResult = await this.psqlClient.messageRepo.create({
            content,
            receiver: receiverUser.id,
            sender: senderUser.id,
            thread: createdOrFoundThread.id,
        });

        await this.addMessageToThread(
            id,
            messageResult.id as number,
            createdOrFoundThread.id as number,
        );

        return new ApiResponse<boolean>(id, Boolean(messageResult));
    };
}
