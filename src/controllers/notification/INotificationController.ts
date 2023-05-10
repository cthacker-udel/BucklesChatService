import { Request, Response } from "express";

export interface INotificationController {
    /**
     * Fetches all notifications from the database and returns their statuses
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns All notifications from the notification table relating to the user specified
     */
    fetchNotifications: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;

    /**
     * Removes a notification from the database
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether the notification was removed
     */
    removeNotification: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;
}
