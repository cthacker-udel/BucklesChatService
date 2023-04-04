/* eslint-disable class-methods-use-this -- disabled */

import { ExceptionLog } from "@/models/logger/ExceptionLog";
import { ILoggerController } from "./ILoggerController";
import { MongoService } from "@/services/mongo/MongoService";
import { EventLog } from "@/models/logger/EventLog";
import { ApiResponse } from "@/models/api/response/ApiResponse";

export class LoggerController implements ILoggerController {
    /** @inheritdoc */
    public LogException = async (
        id: string,
        mongoService: MongoService,
        exceptionLog: ExceptionLog,
    ): Promise<ApiResponse<boolean>> => {
        const result = await mongoService
            .collection(
                mongoService.db(process.env.MONGO_DB_NAME ?? ""),
                process.env.MONGO_COLLECTION_NAME ?? "",
            )
            .insertOne(exceptionLog);
        return new ApiResponse<boolean>(id).setData(result.acknowledged);
    };

    /** @inheritdoc */
    public LogEvent = async (
        id: string,
        mongoService: MongoService,
        eventLog: EventLog,
    ): Promise<ApiResponse<boolean>> => {
        const result = await mongoService
            .collection(
                mongoService.db(process.env.MONGO_DB_NAME ?? ""),
                process.env.MONGO_COLLECTION_NAME ?? "",
            )
            .insertOne(eventLog);
        return new ApiResponse<boolean>(id).setData(result.acknowledged);
    };
}
