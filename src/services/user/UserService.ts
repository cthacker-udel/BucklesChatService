/* eslint-disable max-lines -- disabled */
/* eslint-disable @typescript-eslint/indent -- disabled */
/* eslint-disable implicit-arrow-linebreak -- disabled */

import { IUserService } from "./IUserService";
import { PSqlService } from "../psql/PSqlService";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { DbUser } from "../../@types/user/DbUser";
import { EncryptionService } from "../encryption/EncryptionService";
import { RedisService } from "../redis/RedisService";
import { ApiErrorInfo } from "../../models/api/errorInfo/ApiErrorInfo";
import { Literal, Op } from "@sequelize/core";
import { User } from "../../models/sequelize/User";
import { DashboardInformation } from "../../@types/user/DashboardInformation";
import { EmailService } from "../email/EmailService";
import { Friend } from "../../models/sequelize/Friend";
import { ActiveStatus, ActiveStatusType } from "../../@types/user/ActiveStatus";
import { ThrottleStatus } from "../../@types/user/ThrottleStatus";
import { LoginResponse } from "../../@types/user/LoginResponse";
import { numericalConverter } from "../../helpers/NumericalConverter/numericalConverter";
import { LoginDiagnostics } from "../../@types/app/LoginDiagnostics";

export class UserService implements IUserService {
    /**
     * The PSQL client instance
     */
    private readonly psqlClient: PSqlService;

    /**
     * The Encryption service used for all password + cookie operations regarding the user
     */
    private readonly encryptionService: EncryptionService;

    /**
     * The redis service instance used to access the database
     */
    private readonly redisService: RedisService;

    /**
     * The sendgrid service for handling emails, validation, etc
     */
    private readonly sendgridService: EmailService;

    /**
     * 4-arg constructor, taking in all necessary services to operate correctly.
     * Takes in primarily the postgres client used for accessing and querying the database.
     * Takes in the encryption service used for hashing and cookie operations.
     * Takes in the redis service which is used for user state, and throttling service.
     * Takes in the sendgrid service which is used to send confirmation emails.
     *
     * @param _psqlClient - The postgres client, instantiated in the root application and passed down from the controller
     * @param _encryptionService - The encryption service, used for hashing and all encryption needs
     * @param _redisService - The redis client instance, used for operations involving the user state, and cookies
     * @param _sendgridService - The sendgrid client instance, used for all operations involving the sendgrid api (emails, automation, etc)
     */
    public constructor(
        _psqlClient: PSqlService,
        _encryptionService: EncryptionService,
        _redisService: RedisService,
        _sendgridService: EmailService,
    ) {
        this.psqlClient = _psqlClient;
        this.redisService = _redisService;
        this.sendgridService = _sendgridService;
        this.encryptionService = _encryptionService;
    }

    /** @inheritdoc */
    public doesUsernameExist = async (id: string, username: string) => {
        const doesUserExist = await this.psqlClient.userRepo?.findOne({
            where: { username },
        });
        return new ApiResponse<boolean>(id).setData(Boolean(doesUserExist));
    };

    /** @inheritdoc */
    public doesFriendshipExist = async (
        id: string,
        userIdOne: number,
        userIdTwo: number,
    ): Promise<boolean> =>
        (await this.psqlClient.friendRepo.findOne({
            where: {
                [Op.or]: [
                    { recipient: userIdOne, sender: userIdTwo },
                    { recipient: userIdTwo, sender: userIdOne },
                ],
            },
        })) !== null;

    /** @inheritdoc */
    public createUser = async (
        id: string,
        username: string,
        password: string,
        passwordSalt: string,
    ): Promise<ApiResponse<boolean>> => {
        const createdUser = await this.psqlClient.userRepo?.create({
            password,
            passwordSalt,
            username,
        });

        return new ApiResponse<boolean>(id).setData(createdUser !== undefined);
    };

    /** @inheritdoc */
    public findUserEncryptionData = async (
        username: string,
    ): Promise<Partial<DbUser>> => {
        const foundUserEncryptionData = await this.psqlClient.userRepo?.findOne(
            {
                attributes: [
                    ["password_salt", "passwordSalt"],
                    ["password", "password"],
                ],
                where: { username },
            },
        );

        if (!foundUserEncryptionData) {
            throw new Error("Invalid username supplied");
        }

        return foundUserEncryptionData.dataValues as Partial<DbUser>;
    };

    /** @inheritdoc */
    public findUserEncryptionDataId = async (
        userId: number,
    ): Promise<Pick<User, "password" | "passwordSalt">> => {
        const foundUserEncryptionData = await this.psqlClient.userRepo.findOne({
            attributes: [["password_salt", "passwordSalt"], "password"],
            where: {
                id: userId,
            },
        });

        if (foundUserEncryptionData === null) {
            throw new Error("No user exists with the id supplied!");
        }

        return foundUserEncryptionData.dataValues;
    };

    /** @inheritdoc */
    public login = async (
        id: string,
        user: Partial<DbUser>,
    ): Promise<[ApiResponse<LoginResponse>, number]> => {
        const { username, password } = user;
        if (username === undefined || password === undefined) {
            return [
                new ApiResponse(
                    id,
                    { loggedIn: false } as LoginResponse,
                    new ApiErrorInfo(id).initException(
                        new Error(
                            "Must supply proper credentials when logging in",
                        ),
                    ),
                ),
                -1,
            ];
        }

        const foundEncryptedPasswordSalt = await this.findUserEncryptionData(
            username,
        );

        if (
            foundEncryptedPasswordSalt.passwordSalt === undefined ||
            foundEncryptedPasswordSalt.password === undefined
        ) {
            return [
                new ApiResponse(
                    id,
                    { loggedIn: false } as LoginResponse,
                    new ApiErrorInfo(id).initException(
                        new Error("No encryption data available for user"),
                    ),
                ),
                -1,
            ];
        }

        const foundUserId = await this.findUserIdFromUsername(username);

        if (foundUserId === undefined) {
            return [
                new ApiResponse(
                    id,
                    { loggedIn: false } as LoginResponse,
                    new ApiErrorInfo(id).initException(
                        new Error("No user id found for username supplied"),
                    ),
                ),
                -1,
            ];
        }

        const fixedEncryptionResult =
            new EncryptionService().fixedValueEncryption(
                foundEncryptedPasswordSalt.passwordSalt,
                password,
            );

        const isValidLogin =
            fixedEncryptionResult === foundEncryptedPasswordSalt.password;

        if (isValidLogin) {
            await this.refreshUserState(id, foundUserId);
        }

        return [
            new ApiResponse(id, { lockedUntil: 0, loggedIn: isValidLogin }),
            foundUserId,
        ];
    };

    /** @inheritdoc */
    public logout = async (
        id: string,
        userId: number,
        ip: string,
    ): Promise<boolean> => {
        try {
            const foundUser = await this.psqlClient.userRepo.findOne({
                where: { id: userId },
            });

            if (foundUser === undefined) {
                throw new Error("User does not exist");
            }

            // set as offline
            const [updatedUserState] = await this.psqlClient.userRepo.update(
                { status: ActiveStatusType.OFFLINE },
                { where: { id: userId } },
            );

            // clear throttle keys from redis cache
            await this.clearThrottleKeys(id, userId, ip);

            // clear user state from cache
            const { data: clearedUserState } = await this.clearUserState(
                id,
                userId,
            );

            return (updatedUserState > 0 && clearedUserState) ?? false;
        } catch {
            // Disregard error, return that logout failed
            return false;
        }
    };

    /** @inheritdoc */
    public signUp = async (
        id: string,
        user: Partial<DbUser>,
    ): Promise<ApiResponse<boolean>> => {
        const { username, password } = user;

        if (username === undefined || password === undefined) {
            throw new Error("Must supply proper credentials when signing up");
        }

        const doesUsernameAlreadyExist = await this.doesUsernameExist(
            id,
            username,
        );

        if (doesUsernameAlreadyExist.data ?? false) {
            throw new Error("Username already exists");
        }

        const encryptionData = new EncryptionService().hmacEncrypt(password);

        if (
            encryptionData.hash === undefined ||
            encryptionData.salt === undefined
        ) {
            throw new Error("An error occurred, please try again.");
        }

        const createUserResult = await this.createUser(
            id,
            username,
            encryptionData.hash,
            encryptionData.salt,
        );

        return new ApiResponse<boolean>(id, createUserResult.data ?? false);
    };

    /** @inheritdoc */
    public removeUser = async (
        id: string,
        fromUserId: number,
        removingUserId: number,
    ): Promise<ApiResponse<boolean>> => {
        const foundUser = await this.psqlClient.userRepo.findOne({
            where: { id: removingUserId },
        });

        if (foundUser === null) {
            return new ApiResponse(id, false);
        }

        const isUsernameInTable = await this.doesUsernameExist(
            id,
            foundUser.username,
        );

        if (!(isUsernameInTable.data ?? true)) {
            throw new Error("Username is not present in database");
        }

        const doesFriendshipExist = await this.doesFriendshipExist(
            id,
            fromUserId,
            removingUserId,
        );

        if (!doesFriendshipExist) {
            throw new Error("Friendship does not exist between the 2 users");
        }

        const removalResult = await this.psqlClient.userRepo?.destroy({
            where: { id: removingUserId },
        });

        if (removalResult === 0 || removalResult === undefined) {
            throw new Error("Unable to remove user");
        }

        return new ApiResponse(id, removalResult > 0);
    };

    /** @inheritdoc */
    public editUser = async (
        id: string,
        userId: number,
        userPayload: Omit<
            DbUser,
            "id" | "password" | "passwordSalt" | "username"
        >,
    ): Promise<ApiResponse<boolean>> => {
        const foundUsername = await this.findUsernameFromUserId(userId);

        if (foundUsername === undefined) {
            return new ApiResponse(id, false);
        }

        const isUsernameInTable = await this.doesUsernameExist(
            id,
            foundUsername,
        );

        if (!(isUsernameInTable.data ?? false)) {
            throw new Error("Username does not exist in table");
        }

        const [updatedCount] = await this.psqlClient.userRepo.update(
            userPayload,
            {
                where: { id: userId },
            },
        );

        if (updatedCount === 0) {
            return new ApiResponse<boolean>(id, false);
        }

        return new ApiResponse<boolean>(id, updatedCount > 0);
    };

    /** @inheritdoc */
    public totalUsersOnline = async (
        id: string,
    ): Promise<ApiResponse<number>> =>
        new ApiResponse(
            id,
            await this.psqlClient.userRepo.count({
                where: { status: ActiveStatusType.ONLINE },
            }),
        );

    /** @inheritdoc */
    public totalUsers = async (id: string): Promise<ApiResponse<number>> => {
        const total = await this.psqlClient.userRepo?.count();
        return new ApiResponse(id, total);
    };

    /** @inheritdoc */
    public totalMessages = async (id: string): Promise<ApiResponse<number>> => {
        const total = await this.psqlClient.messageRepo.count();
        return new ApiResponse(id, total);
    };

    /** @inheritdoc */
    public loginDiagnostics = async (
        id: string,
    ): Promise<ApiResponse<LoginDiagnostics>> => {
        const { data: totalMessages } = await this.totalMessages(id);
        const { data: totalUsers } = await this.totalUsers(id);
        const { data: totalOnline } = await this.totalUsersOnline(id);

        return new ApiResponse(id, {
            totalMessages,
            totalOnline,
            totalUsers,
        } as LoginDiagnostics);
    };

    /** @inheritdoc */
    public dashboardInformation = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<DashboardInformation>> => {
        const queryResult = await this.psqlClient.userRepo.findOne({
            attributes: [
                "handle",
                ["profile_image_url", "profileImageUrl"],
                ["is_email_confirmed", "isEmailConfirmed"],
                ["created_at", "createdAt"],
                "username",
            ],
            where: { id: userId },
        });

        const { data: numberOfFriends } = await this.numberOfFriends(
            id,
            userId,
        );

        const { data: numberOfMessages } = await this.numberOfMessages(
            id,
            userId,
        );

        const { data: bulkFriendsDashboardInformation } =
            await this.friendsDashboardInformation(id, userId);

        if (!queryResult) {
            return new ApiResponse(id);
        }

        return new ApiResponse(id, {
            ...queryResult.dataValues,
            friendsInformation: bulkFriendsDashboardInformation,
            numberOfFriends,
            numberOfMessages,
        } as DashboardInformation);
    };

    /** @inheritdoc */
    public bulkDashboardInformation = async (
        id: string,
        usernames: string[],
    ): Promise<ApiResponse<DashboardInformation[]>> => {
        const foundUsers = await this.psqlClient.userRepo.findAll({
            attributes: ["id"],
            where: {
                username: {
                    [Op.in]: usernames,
                },
            },
        });

        const userIds = foundUsers.map(
            (eachUser: User) => eachUser.id as number,
        );

        const queryResult = await this.psqlClient.userRepo.findAll({
            attributes: [
                "handle",
                ["profile_image_url", "profileImageUrl"],
                ["created_at", "createdAt"],
                "username",
                "id",
            ],
            order: [["username", "ASC"]],
            where: {
                id: {
                    [Op.in]: userIds,
                },
            },
        });

        if (queryResult.length === 0) {
            return new ApiResponse(id);
        }

        const dbUsers: DashboardInformation[] = [];

        queryResult.forEach((eachUser: User) => {
            dbUsers.push(eachUser.dataValues as DashboardInformation);
        });

        return new ApiResponse(id, dbUsers);
    };

    /** @inheritdoc */
    public details = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<DashboardInformation>> => {
        const queryResult = await this.psqlClient.userRepo.findOne({
            attributes: [
                ["first_name", "firstName"],
                ["last_name", "lastName"],
                ["is_email_confirmed", "isEmailConfirmed"],
                "email",
                "handle",
                "dob",
                "username",
            ],
            where: { id: userId },
        });

        if (!queryResult) {
            return new ApiResponse(id);
        }

        return new ApiResponse(
            id,
            queryResult.dataValues as DashboardInformation,
        );
    };

    /** @inheritdoc */
    public numberOfFriends = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<number>> => {
        const queryResult = await this.psqlClient.friendRepo.findAll({
            attributes: ["sender", "recipient"],
            where: { [Op.or]: [{ recipient: userId }, { sender: userId }] },
        });

        return new ApiResponse(id, queryResult.length);
    };

    /** @inheritdoc */
    public numberOfMessages = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<number>> => {
        const queryResult = await this.psqlClient.messageRepo.findAll({
            where: { sender: userId },
        });
        return new ApiResponse(id, queryResult.length);
    };

    /** @inheritdoc */
    public friendsDashboardInformation = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<DashboardInformation[]>> => {
        const friendsFromYourRequest = await this.psqlClient.friendRepo.findAll(
            {
                attributes: ["recipient"],
                where: { sender: userId },
            },
        );

        const friendsFromTheirRequest =
            await this.psqlClient.friendRepo.findAll({
                attributes: ["sender"],
                where: { recipient: userId },
            });

        const usernamesOfFriendsFromYourRequest =
            await this.psqlClient.userRepo.findAll({
                attributes: ["username"],
                where: {
                    id: {
                        [Op.in]: friendsFromYourRequest.map(
                            (eachFriend) => eachFriend.recipient,
                        ),
                    },
                },
            });

        const usernamesOfFriendsFromTheirRequest =
            await this.psqlClient.userRepo.findAll({
                attributes: ["username"],
                where: {
                    id: {
                        [Op.in]: friendsFromTheirRequest.map(
                            (eachFriend: Friend) => eachFriend.sender,
                        ),
                    },
                },
            });

        const amalgamatedUsernames = [
            ...new Set(
                usernamesOfFriendsFromYourRequest
                    .map((eachFriend) => eachFriend.username)
                    .concat(
                        usernamesOfFriendsFromTheirRequest.map(
                            (eachFriend) => eachFriend.username,
                        ),
                    ),
            ),
        ];

        const allUsernamesDashboardInformation =
            await this.bulkDashboardInformation(id, amalgamatedUsernames);
        return allUsernamesDashboardInformation;
    };

    /** @inheritdoc */
    public isEmailValid = async (
        id: string,
        email: string,
    ): Promise<ApiResponse<boolean>> =>
        new ApiResponse(id, await this.sendgridService.isEmailValid(email));

    /** @inheritdoc */
    public sendWelcomeEmail = async (
        id: string,
        email: string,
    ): Promise<ApiResponse<boolean>> => {
        const userResponse = await this.psqlClient.userRepo.findOne({
            attributes: ["username"],
            where: { email },
        });

        if (userResponse === null) {
            return new ApiResponse(id, false);
        }

        const { username } = userResponse;

        return new ApiResponse(
            id,
            await this.sendgridService.sendEmail({
                dynamicTemplateData: { username },
                templateId: process.env.WELCOME_EMAIL_TEMPLATE_ID as string,
                to: { email },
            }),
        );
    };

    /** @inheritdoc */
    public confirmEmail = async (
        id: string,
        userId: number,
        confirmationToken: string,
    ): Promise<ApiResponse<boolean>> => {
        const foundUser = await this.psqlClient.userRepo.findOne({
            attributes: [
                ["email_confirmation_token", "emailConfirmationToken"],
                ["is_email_confirmed", "isEmailConfirmed"],
            ],
            where: { id: userId },
        });

        if (foundUser?.isEmailConfirmed ?? false) {
            return new ApiResponse(id, false);
        }

        if (foundUser?.emailConfirmationToken !== confirmationToken) {
            return new ApiResponse(id, false);
        }

        const [updatedEntities] = await this.psqlClient.userRepo.update(
            {
                emailConfirmationToken: new Literal(null),
                isEmailConfirmed: true,
            },
            { where: { id: userId } },
        );

        return new ApiResponse(id, updatedEntities > 0);
    };

    /** @inheritdoc */
    public sendConfirmationEmail = async (
        id: string,
        email: string,
    ): Promise<ApiResponse<boolean>> => {
        const foundUser = await this.psqlClient.userRepo.findOne({
            where: { email },
        });

        if (foundUser === null) {
            return new ApiResponse(id, false);
        }

        const { username } = foundUser;
        const token = new EncryptionService().generateSalt();

        const [updateCount] = await this.psqlClient.userRepo.update(
            { emailConfirmationToken: token, isEmailConfirmed: false },
            { where: { email } },
        );

        if (updateCount === 0) {
            return new ApiResponse(id, false);
        }

        const confirmationEmailResponse = await this.sendgridService.sendEmail({
            dynamicTemplateData: {
                baseUrl: process.env.BASE_URL as string,
                token,
                username,
            },
            templateId: process.env.CONFIRMATION_EMAIL_TEMPLATE_ID as string,
            to: { email },
        });

        return new ApiResponse(id, confirmationEmailResponse);
    };

    /** @inheritdoc */
    public findUserIdFromUsername = async (
        username: string,
    ): Promise<number | undefined> => {
        const foundUser = await this.psqlClient.userRepo.findOne({
            attributes: ["id"],
            where: { username },
        });

        if (foundUser?.id === undefined) {
            return undefined;
        }

        return foundUser.id;
    };

    /** @inheritdoc */
    public findUsernameFromUserId = async (
        userId: number,
    ): Promise<string | undefined> => {
        const foundUser = await this.psqlClient.userRepo.findOne({
            attributes: ["username"],
            where: { id: userId },
        });

        if (foundUser === null) {
            return undefined;
        }

        return foundUser.username;
    };

    /** @inheritdoc */
    public refreshUserState = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<boolean>> => {
        const result = await this.redisService.client.set(
            `user_state_${userId}`,
            `${
                Number.parseInt(
                    process.env
                        .STATE_EXPIRATION_TIME_SECONDS as unknown as string,
                    10,
                ) * 1000
            }`,
            {
                EX: process.env
                    .STATE_EXPIRATION_TIME_SECONDS as unknown as number,
            },
        );

        return new ApiResponse(id, result !== null);
    };

    /** @inheritdoc */
    public isUserStateInCache = async (userId: number): Promise<boolean> => {
        const result = await this.redisService.client.exists(
            `user_state_${userId}`,
        );

        return result > 0;
    };

    /** @inheritdoc */
    public expireTimeOfUserState = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<ActiveStatus>> => {
        const timeLeft = await this.redisService.client.pTTL(
            `user_state_${userId}`,
        );

        if (timeLeft < 0) {
            throw new Error(
                timeLeft === -1
                    ? "No expire time set for this entry"
                    : "The key does not exist",
            );
        }

        const setTime = await this.redisService.client.get(
            `user_state_${userId}`,
        );

        if (setTime === null) {
            throw new Error("Key does not exist");
        }

        const timeElapsed = Number.parseInt(setTime, 10) - timeLeft;

        const isAway =
            timeElapsed >
                Number.parseInt(
                    process.env.STATE_EXPIRATION_AWAY_THRESHOLD as string,
                    10,
                ) && timeElapsed > 0;

        const currentStatus =
            timeElapsed <= 0 || timeLeft <= 0
                ? ActiveStatusType.OFFLINE
                : ActiveStatusType.ONLINE;

        await this.psqlClient.userRepo.update(
            {
                status: isAway ? ActiveStatusType.AWAY : currentStatus,
            },
            { where: { id: userId } },
        );

        return new ApiResponse(id, {
            status: isAway ? ActiveStatusType.AWAY : currentStatus,
            timeLeft,
        });
    };

    /** @inheritdoc */
    public clearUserState = async (
        id: string,
        userId: number,
    ): Promise<ApiResponse<boolean>> => {
        const removalResult = await this.redisService.client.del(
            `user_state_${userId}`,
        );

        if (removalResult === 0) {
            return new ApiResponse(id, false);
        }

        return new ApiResponse(id, true);
    };

    /** @inheritdoc */
    public setThrottleStatus = async (key: string): Promise<ThrottleStatus> => {
        const newStatus: ThrottleStatus = {
            failedAttempts: 0,
            lockedAt: 0,
        };
        const settingStatus = await this.redisService.client.set(
            `${key}_throttle_status`,
            JSON.stringify(newStatus),
            { EX: numericalConverter.minutes.toSeconds(5) },
        );

        if (settingStatus === null) {
            throw new Error("Unable to set throttle status");
        }

        return newStatus;
    };

    /** @inheritdoc */
    public getThrottleStatusIp = async (
        ip: string,
    ): Promise<ThrottleStatus> => {
        const throttleStatus = await this.redisService.client.get(
            `${ip}_throttle_status`,
        );

        if (throttleStatus === null) {
            const createdThrottleStatus = await this.setThrottleStatus(ip);
            return createdThrottleStatus;
        }

        return JSON.parse(throttleStatus) as ThrottleStatus;
    };

    /** @inheritdoc */
    public getThrottleStatusUsername = async (
        username: string,
    ): Promise<ThrottleStatus> => {
        const throttleStatus = await this.redisService.client.get(
            `${username}_throttle_status`,
        );

        if (throttleStatus === null) {
            const createdThrottleStatus = await this.setThrottleStatus(
                username,
            );
            return createdThrottleStatus;
        }

        return JSON.parse(throttleStatus) as ThrottleStatus;
    };

    /** @inheritdoc */
    public incrementThrottleStatus = async (key: string): Promise<boolean> => {
        const exists = await this.redisService.client.exists(
            `${key}_throttle_status`,
        );

        if (exists === 0) {
            await this.setThrottleStatus(key);
        }

        const throttleStatus = await this.redisService.client.get(
            `${key}_throttle_status`,
        );

        if (throttleStatus === null) {
            return false;
        }

        const convertedThrottleStatus = JSON.parse(
            throttleStatus,
        ) as ThrottleStatus;

        const updateResult = await this.redisService.client.set(
            `${key}_throttle_status`,
            JSON.stringify({
                ...convertedThrottleStatus,
                failedAttempts: convertedThrottleStatus.failedAttempts + 1,
            } as ThrottleStatus),
        );

        return updateResult !== null;
    };

    /** @inheritdoc */
    public evaluateThrottleStatus = async (
        key: string,
        type: "IP" | "USERNAME",
    ): Promise<[isThrottled: boolean, lockedUntil: number]> => {
        const throttleStatus = await this.redisService.client.get(
            `${key}_throttle_status`,
        );

        if (throttleStatus === null) {
            await this.setThrottleStatus(key);
            return [false, 0];
        }

        const convertedThrottleStatus = JSON.parse(
            throttleStatus,
        ) as ThrottleStatus;

        const { failedAttempts, lockedAt } = convertedThrottleStatus;
        const minutesLimit = Number(
            process.env[`FAILED_${type}_ATTEMPTS_${failedAttempts}`],
        );

        if (!isNaN(minutesLimit) && lockedAt === 0) {
            // update the locked at in the database with the current time, and return the current time + the time remaining
            await this.redisService.client.set(
                `${key}_throttle_status`,
                JSON.stringify({
                    ...convertedThrottleStatus,
                    lockedAt: Date.now(),
                }),
            );
            return [
                true,
                Date.now() +
                    numericalConverter.minutes.toMilliseconds(minutesLimit),
            ];
        }

        const timeThreshold =
            numericalConverter.minutes.toMilliseconds(minutesLimit);
        const timeBetween = Date.now() - lockedAt;

        if (timeBetween >= timeThreshold) {
            // If the time has elapsed, update value in cache
            const updatedThrottleStatus = {
                failedAttempts:
                    convertedThrottleStatus.failedAttempts === 30
                        ? 0
                        : convertedThrottleStatus.failedAttempts,
                lockedAt: 0,
            } as ThrottleStatus;
            await this.redisService.client.set(
                `${key}_throttle_status`,
                JSON.stringify(updatedThrottleStatus),
                { EX: numericalConverter.minutes.toSeconds(minutesLimit + 5) },
            );
            return [false, 0];
        }

        if (isNaN(minutesLimit)) {
            return [false, 0];
        }

        return [
            true,
            lockedAt + numericalConverter.minutes.toMilliseconds(minutesLimit),
        ];
    };

    /** @inheritdoc */
    public clearThrottleKeys = async (
        id: string,
        userId: number,
        ip: string,
    ): Promise<ApiResponse<[ip: boolean, username: boolean]>> => {
        const foundUser = await this.psqlClient.userRepo.findOne({
            attributes: ["username"],
            where: { id: userId },
        });

        if (foundUser === null) {
            throw new Error("User must exist");
        }

        const removeIpKeyResult = await this.redisService.client.del(
            `${ip}_throttle_status`,
        );
        const removeUsernameResult = await this.redisService.client.del(
            `${foundUser.username}_throttle_status`,
        );

        return new ApiResponse(id, [
            removeIpKeyResult > 0,
            removeUsernameResult > 0,
        ]);
    };

    /** @inheritdoc */
    public clearKey = async (key: string): Promise<boolean> => {
        const result = await this.redisService.client.del(key);

        return result > 0;
    };

    /** @inheritdoc */
    public flushCache = async (id: string): Promise<ApiResponse<boolean>> => {
        const result = await this.redisService.client.flushDb();

        return new ApiResponse(id, result !== null);
    };

    /** @inheritdoc */
    public changePassword = async (
        id: string,
        userId: number,
        requestedChangePassword: string,
    ): Promise<ApiResponse<boolean>> => {
        const { password, passwordSalt } = await this.findUserEncryptionDataId(
            userId,
        );

        const fixedEncryption = this.encryptionService.fixedValueEncryption(
            passwordSalt,
            requestedChangePassword,
        );

        if (fixedEncryption === password) {
            throw new Error("Same password used!");
        }

        const { hash, salt } = this.encryptionService.hmacEncrypt(
            requestedChangePassword,
        );

        const [updateResult] = await this.psqlClient.userRepo.update(
            { password: hash, passwordSalt: salt },
            { where: { id: userId } },
        );

        return new ApiResponse(id, updateResult > 0);
    };
}
