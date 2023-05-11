/* eslint-disable max-lines-per-function -- disabled */
/* eslint-disable @typescript-eslint/indent -- disabled */
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
import { Friend } from "../../models/sequelize/Friend";
import { Block } from "../../models/sequelize/Block";
import { NotificationService } from "../notification/NotificationService";
import { NotificationType } from "../../models/sequelize/Notification";

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
     * Service used for adding notifications to the database
     */
    private readonly notificationService: NotificationService;

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
        _notificationService: NotificationService,
    ) {
        this.psqlClient = _psqlClient;
        this.loggerService = _loggerService;
        this.redisService = _redisService;
        this.notificationService = _notificationService;
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
        userIdTo: number,
        userIdFrom: number,
        customMessage?: string,
    ): Promise<ApiResponse<boolean>> => {
        if (userIdTo === undefined || userIdFrom === undefined) {
            return new ApiResponse<boolean>(id, false);
        }

        const foundUserTo = await this.psqlClient.userRepo.findOne({
            where: { id: userIdTo },
        });
        const foundUserFrom = await this.psqlClient.userRepo.findOne({
            where: { id: userIdFrom },
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

        await this.notificationService.addNotification(
            userIdFrom,
            userIdTo,
            NotificationType.SENDING_FRIEND_REQUEST,
        );

        return new ApiResponse<boolean>(id, insertionResult !== null);
    };

    /** @inheritdoc */
    public availableFriends = async (
        id: string,
        userId: number,
    ): Promise<
        ApiResponse<
            Pick<
                User,
                "createdAt" | "handle" | "id" | "profileImageUrl" | "username"
            >[]
        >
    > => {
        if (userId === undefined) {
            return new ApiResponse(
                id,
                [] as Pick<
                    User,
                    | "createdAt"
                    | "handle"
                    | "id"
                    | "profileImageUrl"
                    | "username"
                >[],
            );
        }

        const foundUser = await this.psqlClient.userRepo.findOne({
            where: { id: userId },
        });

        if (foundUser === null) {
            return new ApiResponse(
                id,
                [] as Pick<
                    User,
                    | "createdAt"
                    | "handle"
                    | "id"
                    | "profileImageUrl"
                    | "username"
                >[],
            );
        }

        const notAvailableFriends = await this.psqlClient.friendRepo.findAll({
            attributes: ["recipient", "sender"],
            where: {
                [Op.or]: [
                    {
                        // p --> q
                        [Op.and]: [
                            { recipient: userId },
                            { [Op.not]: { sender: userId } },
                        ],
                    },
                    {
                        // ~p --> ~q
                        [Op.and]: [
                            { [Op.not]: { recipient: userId } },
                            { [Op.not]: { [Op.not]: { sender: userId } } },
                        ],
                    },
                ],
            },
        });

        const notAvailableFriendRequests =
            await this.psqlClient.friendRequestRepo.findAll({
                attributes: ["username", "sender"],
                where: {
                    [Op.or]: [
                        {
                            // p --> q
                            [Op.and]: [
                                { username: userId },
                                { [Op.not]: { sender: userId } },
                            ],
                        },
                        {
                            // ~p --> ~q
                            [Op.and]: [
                                { [Op.not]: { username: userId } },
                                {
                                    [Op.not]: {
                                        [Op.not]: { sender: userId },
                                    },
                                },
                            ],
                        },
                    ],
                },
            });

        const notAvailableBlockUsers = await this.psqlClient.blockRepo.findAll({
            attributes: ["blocked", "sender"],
            where: {
                [Op.or]: [
                    {
                        // p --> q
                        [Op.and]: [
                            { blocked: userId },
                            { [Op.not]: { sender: userId } },
                        ],
                    },
                    {
                        // ~p --> ~q
                        [Op.and]: [
                            { [Op.not]: { blocked: userId } },
                            { [Op.not]: { [Op.not]: { sender: userId } } },
                        ],
                    },
                ],
            },
        });

        const notAvailableUserIdsSet = new Set<number>(
            ...[
                notAvailableBlockUsers
                    .map((eachBlockedUser: Block) => [
                        eachBlockedUser.blocked,
                        eachBlockedUser.sender,
                    ])
                    .concat(
                        notAvailableFriendRequests.map(
                            (eachFriendRequest: FriendRequest) => [
                                eachFriendRequest.sender,
                                eachFriendRequest.username,
                            ],
                        ),
                    )
                    .concat(
                        notAvailableFriends.map(
                            (eachAvailableFriend: Friend) => [
                                eachAvailableFriend.sender,
                                eachAvailableFriend.recipient,
                            ],
                        ),
                    )
                    .flat(3),
            ],
        );

        const allValidUserUsernames = (
            await this.psqlClient.userRepo.findAll({
                attributes: [
                    "id",
                    "username",
                    "handle",
                    ["created_at", "createdAt"],
                    ["profile_image_url", "profileImageUrl"],
                ],
                order: [["username", "ASC"]],
                where: {
                    [Op.not]: { id: userId },
                },
            })
        )
            .filter(
                (eachUser: User | null) =>
                    !notAvailableUserIdsSet.has(eachUser!.id as number),
            )
            .map(
                (eachUser: User | null) =>
                    ({
                        ...eachUser?.dataValues,
                    } as Pick<
                        User,
                        | "createdAt"
                        | "handle"
                        | "id"
                        | "profileImageUrl"
                        | "username"
                    >),
            );

        return new ApiResponse(id, allValidUserUsernames);
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

        const senderIds = foundFriendRequests
            .filter(
                (eachFriendRequest: FriendRequest | null) =>
                    eachFriendRequest !== null,
            )
            .map(
                (eachFriendRequest: FriendRequest | null) =>
                    eachFriendRequest!.sender,
            );

        const foundUsers = await this.psqlClient.userRepo.findAll({
            attributes: [
                ["profile_image_url", "profileImageUrl"],
                "username",
                "id",
            ],
            where: {
                id: {
                    [Op.in]: senderIds,
                },
            },
        });

        const friendRequestLookup: {
            [key: number]: Partial<FriendRequest> & Partial<User>;
        } = {};

        foundFriendRequests.forEach((eachFriendRequest) => {
            friendRequestLookup[eachFriendRequest.sender] = {
                ...eachFriendRequest.dataValues,
            } as Partial<FriendRequest> & Partial<User>;
        });

        foundUsers.forEach((eachUser) => {
            if (
                eachUser?.id !== undefined &&
                eachUser.id in friendRequestLookup
            ) {
                friendRequestLookup[eachUser.id] = {
                    ...friendRequestLookup[eachUser.id],
                    ...eachUser.dataValues,
                } as Partial<FriendRequest> & Partial<User>;
            }
        });

        const friendRequestDTOs: FriendRequestDTO[] = foundUsers.map(
            (eachUser: User | null) => {
                if (eachUser?.id !== undefined) {
                    const {
                        customMessage,
                        sender,
                        profileImageUrl: senderProfileImageUrl,
                        createdAt,
                        username,
                    } = friendRequestLookup[eachUser.id] as unknown as Pick<
                        FriendRequest,
                        "createdAt" | "customMessage" | "id" | "sender"
                    > &
                        Pick<User, "profileImageUrl" | "username">;

                    return {
                        createdAt,
                        customMessage,
                        sender,
                        senderProfileImageUrl,
                        username,
                    } as FriendRequestDTO;
                }
                return undefined;
            },
        ) as unknown as FriendRequestDTO[];

        return new ApiResponse(id, friendRequestDTOs);
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

        await this.notificationService.addNotification(
            userIdTo,
            userIdFrom,
            NotificationType.ACCEPTED_FRIEND_REQUEST,
        );

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

        await this.notificationService.addNotification(
            userIdTo,
            userIdFrom,
            NotificationType.REJECTED_FRIEND_REQUEST,
        );

        return new ApiResponse<boolean>(id, destroyResult > 0);
    };

    /** @inheritdoc */
    public removeFriend = async (
        id: string,
        userIdTo: number,
        userIdFrom: number,
    ): Promise<ApiResponse<boolean>> => {
        const doesFriendshipExist = await this.doesFriendshipExist(
            userIdTo,
            userIdFrom,
        );

        if (!doesFriendshipExist) {
            throw new Error("Friendship does not exist");
        }

        const removeResult = await this.psqlClient.friendRepo.destroy({
            where: {
                [Op.or]: [
                    { recipient: userIdTo, sender: userIdFrom },
                    { recipient: userIdFrom, sender: userIdTo },
                ],
            },
        });

        await this.notificationService.addNotification(
            userIdTo,
            userIdFrom,
            NotificationType.REMOVED_FRIEND,
        );

        return new ApiResponse<boolean>(id, removeResult > 0);
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
