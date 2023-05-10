/* eslint-disable @typescript-eslint/no-misused-promises -- disabled */
/* eslint-disable @typescript-eslint/brace-style -- disabled */
import { Request, Response } from "express";
import { BucklesRouteType } from "../../constants/enums/BucklesRouteType";
import { LoggerService } from "../../services/logger/LoggerService";
import { NotificationService } from "../../services/notification/NotificationService";
import { PSqlService } from "../../services/psql/PSqlService";
import { BaseController } from "../base/BaseController";
import { INotificationController } from "./INotificationController";
import { exceptionToExceptionLog } from "../../helpers/logger/exceptionToExceptionLog";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { ApiErrorInfo } from "../../models/api/errorInfo/ApiErrorInfo";
import { getIdFromRequest } from "../../helpers/api/getIdFromRequest";
import { EncryptionService } from "../../services/encryption/EncryptionService";
import { authToken } from "../../middleware/authtoken/authtoken";

export class NotificationController
    extends BaseController
    implements INotificationController
{
    /**
     * The internal psqlClient instance allowing for querying of the database
     */
    private readonly psqlClient: PSqlService;

    /**
     * Logger controller used for logging exceptions to the mongo database
     */
    private readonly loggerService: LoggerService;

    /**
     * The service used for sending/removing notifications from the database
     */
    private readonly notificationService: NotificationService;

    /**
     * Encryption service used for fetching user id from request
     */
    private readonly encryptionService: EncryptionService;

    /**
     * 2-arg constructor instantiating the notification controller, which houses all the notifications
     * the user experiences
     *
     * @param _psqlService - The psql client used for accessing the database
     * @param _loggerService - The logger service used for logging errors to the mongodb database
     */
    public constructor(
        _psqlService: PSqlService,
        _loggerService: LoggerService,
        _encryptionService: EncryptionService,
    ) {
        super(undefined, "notification");
        this.psqlClient = _psqlService;
        this.loggerService = _loggerService;
        this.notificationService = new NotificationService(this.psqlClient);
        this.encryptionService = _encryptionService;

        super.addRoutes(
            [
                {
                    endpoint: "notifications",
                    handler: this.fetchNotifications,
                    middleware: [authToken],
                },
            ],
            BucklesRouteType.GET,
        );

        super.setStatusFunction(() => {
            if (!this.psqlClient.connected) {
                throw new Error("PSQL client is disconnected");
            }
            if (this.loggerService === undefined) {
                throw new Error("Logger service is offline");
            }
            if (this.notificationService === undefined) {
                throw new Error("Notification service is offline");
            }
        });
    }

    /** @inheritdoc */
    public fetchNotifications = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);

            const userId = this.encryptionService.getUserIdFromRequest(request);

            if (userId === undefined) {
                throw new Error("Must supply user id in request");
            }

            const result = await this.notificationService.fetchNotifications(
                id,
                userId,
            );

            response.status(200);
            response.send(result);
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
            response.status(500);
            response.send(
                new ApiResponse(id).setApiError(
                    new ApiErrorInfo(id).initException(error),
                ),
            );
        }
    };
}
