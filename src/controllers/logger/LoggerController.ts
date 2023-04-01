/* eslint-disable class-methods-use-this -- disabled */

import { ExceptionLog } from "@/models/logger/ExceptionLog";
import { ILoggerController } from "./ILoggerController";
import { MongoService } from "@/services/mongo/MongoService";
import { EventLog } from "@/models/logger/EventLog";

export class LoggerController implements ILoggerController {
    /** @inheritdoc */
    public LogException = async (
        mongoService: MongoService,
        exceptionLog: ExceptionLog,
    ): Promise<boolean> => {
        const result = await mongoService
            .collection(
                mongoService.db(process.env.MONGO_DB_NAME ?? ""),
                process.env.MONGO_COLLECTION_NAME ?? "",
            )
            .insertOne(exceptionLog);
        return result.acknowledged;
    };

    /** @inheritdoc */
    public LogEvent = async (
        mongoService: MongoService,
        eventLog: EventLog,
    ): Promise<boolean> => {
        const result = await mongoService
            .collection(
                mongoService.db(process.env.MONGO_DB_NAME ?? ""),
                process.env.MONGO_COLLECTION_NAME ?? "",
            )
            .insertOne(eventLog);
        return result.acknowledged;
    };
}
