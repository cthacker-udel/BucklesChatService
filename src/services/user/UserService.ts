/* eslint-disable implicit-arrow-linebreak -- disabled */

import { IUserService } from "./IUserService";
import { PSqlService } from "../psql/PSqlService";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { LoggerService } from "../logger/LoggerService";
import { DbUser } from "../../@types/user/DbUser";
import { EncryptionService } from "../encryption/EncryptionService";
import { RedisService } from "../redis/RedisService";
import { ApiErrorInfo } from "../../models/api/errorInfo/ApiErrorInfo";
import { Op } from "@sequelize/core";
import { User } from "../../models/sequelize/User";
import { DashboardInformation } from "../../@types/user/DashboardInformation";
import { EmailService } from "../email/EmailService";

export class UserService implements IUserService {
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
     * The sendgrid service for handling emails, validation, etc
     */
    private readonly sendgridService: EmailService;

    /**
     * Three-arg constructor, takes in a sql client used for interacting with the database that stores user information,
     * and takes in an LoggerService instance used for logging exceptions to the mongo database.
     *
     * @param _psqlClient - The psql client which is used to access user information
     * @param _loggerService - The logger service which is used to add logs to the mongo database
     */
    public constructor(
        _psqlClient: PSqlService,
        _loggerService: LoggerService,
        _redisService: RedisService,
        _sendgridService: EmailService,
    ) {
        this.psqlClient = _psqlClient;
        this.loggerService = _loggerService;
        this.redisService = _redisService;
        this.sendgridService = _sendgridService;
    }

    /** @inheritdoc */
    public doesUsernameExist = async (id: string, username: string) => {
        const doesUserExist = await this.psqlClient.userRepo?.findOne({
            where: { username },
        });
        return new ApiResponse<boolean>(id).setData(Boolean(doesUserExist));
    };

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
    public login = async (
        id: string,
        user: Partial<DbUser>,
    ): Promise<ApiResponse<boolean>> => {
        const { username, password } = user;
        if (username === undefined || password === undefined) {
            return new ApiResponse<boolean>(
                id,
                false,
                new ApiErrorInfo(id).initException(
                    new Error("Must supply proper credentials when logging in"),
                ),
            );
        }

        const foundEncryptedPasswordSalt = await this.findUserEncryptionData(
            username,
        );

        if (
            foundEncryptedPasswordSalt.passwordSalt === undefined ||
            foundEncryptedPasswordSalt.password === undefined
        ) {
            return new ApiResponse<boolean>(
                id,
                false,
                new ApiErrorInfo(id).initException(
                    new Error("No encryption data available for user"),
                ),
            );
        }

        const fixedEncryptionResult =
            new EncryptionService().fixedValueEncryption(
                foundEncryptedPasswordSalt.passwordSalt,
                password,
            );

        return new ApiResponse(
            id,
            fixedEncryptionResult === foundEncryptedPasswordSalt.password,
        );
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
        username: string,
    ): Promise<ApiResponse<boolean>> => {
        const isUsernameInTable = await this.doesUsernameExist(id, username);

        if (!(isUsernameInTable.data ?? true)) {
            throw new Error("Username is not present in database");
        }

        const removalResult = await this.psqlClient.userRepo?.destroy({
            where: { username },
        });

        if (removalResult === 0 || removalResult === undefined) {
            throw new Error("Unable to remove user");
        }

        return new ApiResponse<boolean>(id, removalResult > 0);
    };

    /** @inheritdoc */
    public editUser = async (
        id: string,
        username: string,
        userPayload: DbUser,
    ): Promise<ApiResponse<boolean>> => {
        const isUsernameInTable = await this.doesUsernameExist(id, username);

        if (!(isUsernameInTable.data ?? false)) {
            throw new Error("Username does not exist in table");
        }

        const request = await this.psqlClient.userRepo?.update(userPayload, {
            where: { username },
        });

        if (request === undefined) {
            return new ApiResponse<boolean>(id, false);
        }

        const numberAffected = request[0];

        return new ApiResponse<boolean>(id, numberAffected > 0);
    };

    /** @inheritdoc */
    public usersOnline = async (id: string): Promise<ApiResponse<number>> =>
        new ApiResponse(id, await this.redisService.client.dbSize());

    /** @inheritdoc */
    public totalUsers = async (id: string): Promise<ApiResponse<number>> => {
        const total = await this.psqlClient.userRepo?.count();
        return new ApiResponse(id, total);
    };

    /** @inheritdoc */
    public dashboardInformation = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<DbUser>> => {
        const queryResult = await this.psqlClient.userRepo?.findOne({
            attributes: [
                "handle",
                ["profile_image_url", "profileImageUrl"],
                ["created_at", "createdAt"],
                "username",
            ],
            where: { username },
        });

        const { data: numberOfFriends } = await this.numberOfFriends(
            id,
            username,
        );

        const { data: numberOfMessages } = await this.numberOfMessages(
            id,
            username,
        );

        const { data: bulkFriendsDashboardInformation } =
            await this.friendsDashboardInformation(id, username);

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
        const queryResult = await this.psqlClient.userRepo?.findAll({
            attributes: [
                "handle",
                ["profile_image_url", "profileImageUrl"],
                ["created_at", "createdAt"],
                "username",
            ],
            order: [["username", "ASC"]],
            where: {
                username: {
                    [Op.in]: usernames,
                },
            },
        });

        if (queryResult.length === 0) {
            return new ApiResponse(id);
        }

        const dbUsers: DashboardInformation[] = [];

        queryResult.forEach((eachUser: User) => {
            dbUsers.push(eachUser.dataValues as DbUser);
        });

        return new ApiResponse(id, dbUsers);
    };

    /** @inheritdoc */
    public details = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<DashboardInformation>> => {
        const queryResult = await this.psqlClient.userRepo?.findOne({
            attributes: [
                ["first_name", "firstName"],
                ["last_name", "lastName"],
                "email",
                "handle",
                "dob",
                "username",
            ],
            where: { username },
        });

        if (!queryResult) {
            return new ApiResponse(id);
        }

        return new ApiResponse(id, queryResult.dataValues as DbUser);
    };

    /** @inheritdoc */
    public numberOfFriends = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<number>> => {
        const queryResult = await this.psqlClient.friendRepo.findAll({
            attributes: ["sender", "recipient"],
            where: { [Op.or]: [{ recipient: username }, { sender: username }] },
        });

        return new ApiResponse(id, queryResult.length);
    };

    /** @inheritdoc */
    public numberOfMessages = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<number>> => {
        const queryResult = await this.psqlClient.messageRepo.findAll({
            where: { sender: username },
        });
        return new ApiResponse(id, queryResult.length);
    };

    /** @inheritdoc */
    public friendsDashboardInformation = async (
        id: string,
        username: string,
    ): Promise<ApiResponse<DashboardInformation[]>> => {
        const sentFriendUsernames = await this.psqlClient.friendRepo.findAll({
            attributes: ["recipient"],
            where: { sender: username },
        });
        const receivedUsernames = await this.psqlClient.friendRepo.findAll({
            attributes: ["sender"],
            where: { recipient: username },
        });

        const amalgamatedUsernames = [
            ...new Set(
                sentFriendUsernames
                    .map((eachFriend) => eachFriend.recipient)
                    .concat(
                        receivedUsernames.map(
                            (eachFriend) => eachFriend.sender,
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
        username: string,
        confirmationToken: string,
    ): Promise<ApiResponse<boolean>> => {
        const foundUser = await this.psqlClient.userRepo.findOne({
            attributes: [
                ["email_confirmation_token", "emailConfirmationToken"],
                ["is_email_confirmed", "isEmailConfirmed"],
            ],
            where: { username },
        });

        if (foundUser?.isEmailConfirmed ?? false) {
            return new ApiResponse(id, false);
        }

        if (foundUser?.emailConfirmationToken !== confirmationToken) {
            return new ApiResponse(id, false);
        }

        const [updatedEntities] = await this.psqlClient.userRepo.update(
            {
                emailConfirmationToken: undefined,
                isEmailConfirmed: true,
            },
            { where: { username } },
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
}
