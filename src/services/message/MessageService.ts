import { Op } from "@sequelize/core";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { Thread } from "../../models/sequelize/Thread";
import { PSqlService } from "../psql/PSqlService";
import { IMessageService } from "./IMessageService";
import { Message } from "../../models/sequelize/Message";

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
    ): Promise<ApiResponse<boolean>> => {
        const doesThreadAlreadyExist = await this.doesThreadExist(
            creator,
            receiver,
        );
        if (doesThreadAlreadyExist) {
            return new ApiResponse(id, false);
        }

        const createResult = await this.psqlClient.threadRepo.create({
            creator,
            receiver,
        });

        return new ApiResponse(id, createResult !== null);
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
}
