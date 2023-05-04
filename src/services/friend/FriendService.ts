/* eslint-disable implicit-arrow-linebreak -- disabled */

import { Op } from "@sequelize/core";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { LoggerService } from "../logger/LoggerService";
import { PSqlService } from "../psql/PSqlService";
import { RedisService } from "../redis/RedisService";
import { IFriendService } from "./IFriendService";
import { FriendRequest } from "../../models/sequelize/FriendRequest";
import { User } from "../../models/sequelize/User";
import { FriendRequestDTO } from "../../@types/friend/FriendRequestDTO";
import { DirectMessagePayload } from "../../controllers/friend/DTO/DirectMessagePayload";
import { Message } from "../../models/sequelize/Message";
import { Block } from "../../models/sequelize/Block";
import { Friend } from "../../models/sequelize/Friend";

export class FriendService implements IFriendService {
    /**
     * The PSQL client instance
     */
    private readonly psqlClient: PSqlService;

    /**
     * The LoggerService instance used for logging exceptions to the mongo database
     */
    private readonly loggerService: LoggerService;

    /**
     * The redis service instance used to access the database
     */
    private readonly redisService: RedisService;

    /**
     * Three-arg constructor, takes in a sql client used for interacting with the database that stores friend information,
     * and takes in an LoggerService instance used for logging exceptions to the mongo database.
     *
     * @param _psqlClient - The psql client which is used to access friend information
     * @param _loggerService - The logger service which is used to add logs to the mongo database
     */
    public constructor(
        _psqlClient: PSqlService,
        _loggerService: LoggerService,
        _redisService: RedisService,
    ) {
        this.psqlClient = _psqlClient;
        this.loggerService = _loggerService;
        this.redisService = _redisService;
    }

    /** @inheritdoc */
    public doesFriendRequestExist = async (
        idTo: number,
        idFrom: number,
    ): Promise<boolean> => {
        const doesFriendRequestAlreadyExist =
            await this.psqlClient.friendRequestRepo.findOne({
                where: { sender: idFrom, username: idTo },
            });
        return doesFriendRequestAlreadyExist !== null;
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
    public sendRequest = async (
        id: string,
        userTo: number,
        userFrom: number,
        customMessage?: string,
    ): Promise<ApiResponse<boolean>> => {
        if (userTo === undefined || userFrom === undefined) {
            return new ApiResponse<boolean>(id, false);
        }

        const foundUserTo = await this.psqlClient.userRepo.findOne({
            where: { id: userTo },
        });
        const foundUserFrom = await this.psqlClient.userRepo.findOne({
            where: { id: userFrom },
        });

        if (foundUserTo?.id === undefined || foundUserFrom?.id === undefined) {
            return new ApiResponse(id, false);
        }

        const doesExist = await this.doesFriendRequestExist(
            foundUserTo.id,
            foundUserFrom.id,
        );

        if (doesExist) {
            return new ApiResponse<boolean>(id, false);
        }

        const insertionResult = await this.psqlClient.friendRequestRepo.create({
            customMessage,
            sender: foundUserFrom.id,
            username: foundUserTo.id,
        });

        return new ApiResponse<boolean>(id, insertionResult !== null);
    };

    /** @inheritdoc */
    public availableFriends = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<string[]>> => {
        if (userId === undefined) {
            return new ApiResponse(id, [] as string[]);
        }

        const foundUser = await this.psqlClient.userRepo.findOne({
            where: { id: userId },
        });

        if (foundUser === null) {
            return new ApiResponse(id, [] as string[]);
        }

        const availableFriends = await this.psqlClient.userRepo.findAll({
            include: [
                {
                    model: FriendRequest,
                    where: {
                        [Op.not]: {
                            [Op.or]: [
                                { sender: foundUser.id },
                                { username: foundUser.id },
                            ],
                        },
                    },
                },
                {
                    model: Block,
                    where: {
                        [Op.not]: [
                            { blocked: foundUser.id },
                            { sender: foundUser.id },
                        ],
                    },
                },
                {
                    model: Friend,
                    where: {
                        [Op.not]: [
                            { recipient: foundUser.id },
                            { sender: foundUser.id },
                        ],
                    },
                },
            ],
            where: {
                id: {
                    [Op.not]: userId,
                },
            },
        });

        return new ApiResponse(
            id,
            availableFriends.map(
                (eachAvailableFriend: User) => eachAvailableFriend.username,
            ),
        );
    };

    /** @inheritdoc */
    public pendingRequests = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<FriendRequestDTO[]>> => {
        const foundFriendRequests =
            await this.psqlClient.friendRequestRepo.findAll({
                attributes: [
                    "username",
                    "sender",
                    ["custom_message", "customMessage"],
                    ["created_at", "createdAt"],
                ],
                where: { username: userId },
            });

        const senderProfilePictures: Promise<User | null>[] = [];
        foundFriendRequests.forEach((eachFriendRequest: FriendRequest) => {
            senderProfilePictures.push(
                this.psqlClient.userRepo.findOne({
                    attributes: [["profile_image_url", "profileImageUrl"]],
                    where: { id: eachFriendRequest.sender },
                }),
            );
        });

        const profilePictureUrls: (string | undefined)[] = (
            await Promise.all(senderProfilePictures)
        ).map((eachUser: User | null) => {
            if (eachUser) {
                return eachUser.profileImageUrl;
            }
            return undefined;
        });

        const finalizedRequests = foundFriendRequests.map(
            (
                eachFoundFriendRequest: FriendRequest,
                _index: number,
            ): FriendRequestDTO => ({
                ...eachFoundFriendRequest,
                senderProfileImageUrl: profilePictureUrls[_index],
            }),
        );

        return new ApiResponse(id, finalizedRequests);
    };

    /** @inheritdoc */
    public acceptRequest = async (
        id: string,
        userIdTo: number,
        userIdFrom: number,
    ): Promise<ApiResponse<boolean>> => {
        const foundUserTo = await this.psqlClient.userRepo.findOne({
            where: { id: userIdTo },
        });
        const foundUserFrom = await this.psqlClient.userRepo.findOne({
            where: { id: userIdFrom },
        });

        if (
            foundUserTo === null ||
            foundUserFrom === null ||
            foundUserTo.id === undefined ||
            foundUserFrom.id === undefined
        ) {
            return new ApiResponse(id, false);
        }

        const doesFriendRequestExist = await this.doesFriendRequestExist(
            foundUserTo.id,
            foundUserFrom.id,
        );

        if (!doesFriendRequestExist) {
            return new ApiResponse<boolean>(id, false);
        }

        const removeRequest = await this.psqlClient.friendRequestRepo.destroy({
            where: { sender: userIdFrom, username: userIdTo },
        });

        if (removeRequest === 0) {
            return new ApiResponse<boolean>(id, false);
        }

        const addAsFriend = await this.psqlClient.friendRepo.create({
            accepted: Date.now(),
            recipient: foundUserTo.id,
            sender: foundUserFrom.id,
        });

        return new ApiResponse<boolean>(id, Boolean(addAsFriend));
    };

    /** @inheritdoc */
    public rejectRequest = async (
        id: string,
        userIdTo: number,
        userIdFrom: number,
    ): Promise<ApiResponse<boolean>> => {
        const foundUserTo = await this.psqlClient.userRepo.findOne({
            where: { id: userIdTo },
        });
        const foundUserFrom = await this.psqlClient.userRepo.findOne({
            where: { id: userIdFrom },
        });

        if (
            foundUserTo === null ||
            foundUserFrom === null ||
            foundUserTo.id === undefined ||
            foundUserFrom.id === undefined
        ) {
            return new ApiResponse(id, false);
        }

        const doesFriendRequestExist = await this.doesFriendRequestExist(
            foundUserTo.id,
            foundUserFrom.id,
        );

        if (!doesFriendRequestExist) {
            return new ApiResponse<boolean>(id, false);
        }

        const destroyResult = await this.psqlClient.friendRequestRepo.destroy({
            where: { sender: userIdFrom, username: userIdTo },
        });

        return new ApiResponse<boolean>(id, destroyResult > 0);
    };

    /** @inheritdoc */
    public removeFriend = async (
        id: string,
        recipient: number,
        sender: number,
    ): Promise<ApiResponse<boolean>> => {
        const doesFriendshipExist = await this.doesFriendshipExist(
            recipient,
            sender,
        );

        if (!doesFriendshipExist) {
            throw new Error("Friendship does not exist");
        }

        const removeResult = await this.psqlClient.friendRepo.destroy({
            where: {
                [Op.or]: [
                    { recipient, sender },
                    { recipient: sender, sender: recipient },
                ],
            },
        });

        return new ApiResponse<boolean>(id, removeResult > 0);
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

        const messageResult = await this.psqlClient.messageRepo.create({
            content,
            receiver: receiverUser.id,
            sender: senderUser.id,
        });

        return new ApiResponse<boolean>(id, Boolean(messageResult));
    };

    /** @inheritdoc */
    public pendingDirectMessages = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<DirectMessagePayload[]>> => {
        const pendingMessages = await this.psqlClient.messageRepo.findAll({
            where: { receiver: username },
        });

        const filteredPendingMessages = pendingMessages.filter(
            (eachPendingMessage) =>
                eachPendingMessage.dataValues.thread === null,
        );

        const convertedMessages = filteredPendingMessages.map(
            (eachResult: Message) =>
                eachResult.dataValues as DirectMessagePayload,
        );

        return new ApiResponse(id, convertedMessages);
    };
}
