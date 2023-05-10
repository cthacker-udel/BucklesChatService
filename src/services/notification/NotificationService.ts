/* eslint-disable implicit-arrow-linebreak -- disabled */
/* eslint-disable @typescript-eslint/indent -- disabled */
import { FetchedNotification } from "../../@types/notification/FetchedNotification";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import {
    Notification,
    NotificationType,
} from "../../models/sequelize/Notification";
import { User } from "../../models/sequelize/User";
import { PSqlService } from "../psql/PSqlService";
import { INotificationService } from "./INotificationService";

export class NotificationService implements INotificationService {
    /**
     * The PSQL client instance
     */
    private readonly psqlClient: PSqlService;

    /**
     * 1-arg constructor, taking in all necessary services to operate correctly.
     * Takes in primarily the postgres client used for accessing and querying the database.
     *
     * @param _psqlClient - The postgres client, instantiated in the root application and passed down from the controller
     */
    public constructor(_psqlClient: PSqlService) {
        this.psqlClient = _psqlClient;
    }

    /** @inheritdoc */
    public addNotification = async (
        sender: number,
        receiver: number,
        notificationType: NotificationType,
    ): Promise<boolean> => {
        const addedNotification = await this.psqlClient.notificationRepo.create(
            { notificationType, receiver, sender },
        );

        return addedNotification !== null;
    };

    /** @inheritdoc */
    public removeNotification = async (id: number): Promise<boolean> => {
        const removedNotification =
            await this.psqlClient.notificationRepo.destroy({ where: { id } });

        return removedNotification > 0;
    };

    /** @inheritdoc */
    public flushNotifications = async (receiver: number): Promise<boolean> => {
        const removeAllNotifications =
            await this.psqlClient.notificationRepo.destroy({
                where: { receiver },
            });

        return removeAllNotifications > 0;
    };

    /** @inheritdoc */
    public fetchNotifications = async (
        id: string,
        receiver: number,
    ): Promise<ApiResponse<FetchedNotification[]>> => {
        const allNotifications = await this.psqlClient.notificationRepo.findAll(
            {
                attributes: [
                    ["created_at", "createdAt"],
                    ["notification_type", "notificationType"],
                ],
                where: { receiver },
            },
        );

        const allUsernamesAndHandles = new Map<
            number,
            Partial<Pick<User, "handle" | "username">>
        >();

        const allRequests: Promise<User | null>[] = [];

        allNotifications.forEach((eachUser: Notification) => {
            if (!allUsernamesAndHandles.has(eachUser.receiver)) {
                allUsernamesAndHandles.set(eachUser.receiver, {});
                allRequests.push(
                    this.psqlClient.userRepo.findOne({
                        where: { id: eachUser.receiver },
                    }),
                );
            }
            if (!allUsernamesAndHandles.has(eachUser.sender)) {
                allUsernamesAndHandles.set(eachUser.sender, {});
                allRequests.push(
                    this.psqlClient.userRepo.findOne({
                        where: { id: eachUser.sender },
                    }),
                );
            }
        });

        const allFoundUsers = await Promise.all(allRequests);

        allFoundUsers.forEach((eachUser: User | null) => {
            if (eachUser !== null) {
                const { handle, id, username } = eachUser.dataValues;
                allUsernamesAndHandles.set(id as number, { handle, username });
            }
        });

        return new ApiResponse(
            id,
            allNotifications.map(
                (eachNotification: Notification) =>
                    ({
                        createdAt: eachNotification.createdAt,
                        id: eachNotification.id,
                        receiverHandle: allUsernamesAndHandles.get(
                            eachNotification.receiver,
                        )?.handle,
                        receiverId: eachNotification.receiver,
                        receiverUsername: allUsernamesAndHandles.get(
                            eachNotification.receiver,
                        )?.username,
                        senderHandle: allUsernamesAndHandles.get(
                            eachNotification.sender,
                        )?.handle,
                        senderId: eachNotification.sender,
                        senderUsername: allUsernamesAndHandles.get(
                            eachNotification.sender,
                        )?.username,
                        type: eachNotification.notificationType,
                    } as FetchedNotification),
            ),
        );
    };
}
