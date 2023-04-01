import { ExceptionLog } from "@/models/logger/ExceptionLog";
import { ILoggerController } from "./ILoggerController";
import { MongoService } from "@/services/mongo/MongoService";

export class LoggerController extends ILoggerController {
    public static async LogException(
        mongoService: MongoService,
        exceptionLog: ExceptionLog,
    ): Promise<boolean> {
        const result = await mongoService
            .collection(
                mongoService.db(process.env.MONGO_DB_NAME ?? ""),
                process.env.MONGO_COLLECTION_NAME ?? "",
            )
            .insertOne(exceptionLog);
        return result.acknowledged;
    }
}
