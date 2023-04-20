/* eslint-disable implicit-arrow-linebreak -- disabled */

import { Op } from "@sequelize/core";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { Thread } from "../../models/sequelize/Thread";
import { PSqlService } from "../psql/PSqlService";
import { IMessageService } from "./IMessageService";
import { Message } from "../../models/sequelize/Message";
import { ThreadMessage } from "../../@types/message/ThreadMessage";

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
        creator: string,
        receiver: string,
    ): Promise<boolean> => {
        const doesExist = await this.psqlClient.threadRepo.findOne({
            where: { creator, receiver },
        });
        return doesExist !== null;
    };

    /** @inheritdoc */
    public createThread = async (
        id: string,
        creator: string,
        receiver: string,
    ): Promise<ApiResponse<number>> => {
        const doesThreadAlreadyExist = await this.doesThreadExist(
            creator,
            receiver,
        );
        if (doesThreadAlreadyExist) {
            return new ApiResponse(id, -1);
        }

        const createResult = await this.psqlClient.threadRepo.create({
            creator,
            receiver,
        });

        return new ApiResponse(id, createResult.dataValues.id);
    };

    /** @inheritdoc */
    public getThreads = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<Thread[]>> => {
        const allThreads = await this.psqlClient.threadRepo.findAll({
            where: {
                [Op.or]: [{ creator: username }, { receiver: username }],
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
                    where: { id: eachMessage.dataValues.id },
                }),
            );
        });
        const result = await Promise.all(deleteRequests);

        const threadRemoval = await this.psqlClient.threadRepo.destroy({
            where: { id: threadId },
        });
        return new ApiResponse(
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
        const doesThreadExist = await this.psqlClient.threadRepo.findOne({
            where: { id: threadId },
        });

        if (doesThreadExist === null) {
            return new ApiResponse(id, false);
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
            Math.max(
                ...allThreadMessages.map(
                    (eachMessage) => eachMessage.dataValues.threadOrder ?? 0,
                ),
            ) + 1;

        /**
         * Checks if the message exists
         */
        const doesMessageExist = await this.psqlClient.messageRepo.findOne({
            where: { id: messageId },
        });

        /**
         * If null then does not exist
         */
        if (doesMessageExist === null) {
            return new ApiResponse(id, false);
        }

        /**
         * Update the message with new threadId and new threadOrder
         */
        const [updated] = await this.psqlClient.messageRepo.update(
            { thread: threadId, threadOrder: newThreadOrder },
            { where: { id: messageId } },
        );

        return new ApiResponse(id, updated > 0);
    };

    /** @inheritdoc */
    public getThreadMessages = async (
        id: string,
        threadId: string,
    ): Promise<ApiResponse<ThreadMessage[]>> => {
        const doesThreadExist = await this.psqlClient.threadRepo.findOne({
            where: { id: threadId },
        });

        if (doesThreadExist === null) {
            return new ApiResponse(id, [] as ThreadMessage[]);
        }

        const allThreadMessages = await this.psqlClient.messageRepo.findAll({
            order: [["thread_order", "DESC"]],
            where: { thread: threadId },
        });

        const convertedThreadMessages = allThreadMessages.map(
            (eachThreadMessage: Message) =>
                eachThreadMessage.dataValues as ThreadMessage,
        );

        return new ApiResponse(id, convertedThreadMessages);
    };
}
