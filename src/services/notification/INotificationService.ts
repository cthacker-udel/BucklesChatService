import { FetchedNotification } from "../../@types/notification/FetchedNotification";
import { ApiResponse } from "../../models/api/response/ApiResponse";
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
     * Removes specified notification from the database
     *
     * @param _id - The id to track the transaction
     * @param _notificationId - The id of the notification to remove
     * @returns Whether the notification was removed or not
     */
    removeNotification: (
        _id: string,
        _notificationId: number,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Deletes all notifications that will be received by the user
     * specified in the function
     *
     * @param _receiver - The receiver of the notification
     * @returns Whether all notifications relating to that user were received
     */
    flushNotifications: (_receiver: number) => Promise<boolean>;

    /**
     * Fetches all notifications in the database belonging to the receiver
     *
     * @param _id - The id to track the transaction
     * @param _receiver - The id of the person receiving the notifications
     * @returns All the fetched notifications from the database
     */
    fetchNotifications: (
        _id: string,
        _receiver: number,
    ) => Promise<ApiResponse<FetchedNotification[]>>;
}
