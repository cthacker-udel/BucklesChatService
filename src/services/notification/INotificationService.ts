import { NotificationType } from "../../models/sequelize/Notification";

/**
 * Interface exposing all methods relating to notifications within the application
 */
export interface INotificationService {
    /**
     * Adds a notification to the database
     *
     * @param _sender - The person sending the notification
     * @param _receiver - The person receiving the notification
     * @returns Whether the notification was added or not
     */
    addNotification: (
        _sender: number,
        _receiver: number,
        _notificationType: NotificationType,
    ) => Promise<boolean>;

    /**
     * Deletes all notifications that will be received by the user
     * specified in the function
     *
     * @param _receiver - The receiver of the notification
     * @returns Whether all notifications relating to that user were received
     */
    flushNotifications: (_receiver: number) => Promise<boolean>;
}
