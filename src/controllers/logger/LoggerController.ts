/* eslint-disable @typescript-eslint/no-misused-promises -- disabled */
/* eslint-disable @typescript-eslint/brace-style -- disabled */

import { MongoService } from "src/services/mongo/MongoService";
import { ILoggerController } from "./ILoggerController";
import { ExceptionLog } from "src/@types/logger/ExceptionLog";
import { EventLog } from "src/@types/logger/EventLog";
import { BaseController } from "../base/BaseController";
import { toBucklesRoute } from "src/helpers/routes/toBucklesRoute";
import { Request, Response } from "express";
import { BucklesRouteType } from "src/constants/enums/BucklesRouteType";
import { LoggerService } from "src/services/logger/LoggerService";
import { getIdFromRequest } from "src/helpers/api/getIdFromRequest";

export class LoggerController
    extends BaseController
    implements ILoggerController
{
    /**
     * The mongo service being utilized by the controller, houses all application logs
     */
    private readonly mongoService: MongoService;

    /**
     * The logger service used for handling database operations
     */
    private readonly loggerService: LoggerService;

    /**
     * One-arg constructor taking in a mongoDB instance
     *
     * @param _mongoService - The mongo server we are utilizing to add records to the db
     */
    public constructor(_mongoService: MongoService) {
        super(undefined, "logger");
        super.addRoutes(
            [toBucklesRoute("exception", this.LogException)],
            BucklesRouteType.POST,
        );
        this.mongoService = _mongoService;
        this.loggerService = new LoggerService(this.mongoService);
    }

    /** @inheritdoc */
    public LogException = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        const id = getIdFromRequest(request);
        const exceptionLog = request.body as ExceptionLog;
        const result = await this.loggerService.LogException(id, exceptionLog);
        response.json(result);
    };

    /** @inheritdoc */
    public LogEvent = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        const id = getIdFromRequest(request);
        const eventLog = request.body as EventLog;
        const result = await this.loggerService.LogEvent(id, eventLog);
        response.json(result);
    };
}
