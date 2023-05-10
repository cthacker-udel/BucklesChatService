import { NotificationType } from "../../models/sequelize/Notification";
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
}
