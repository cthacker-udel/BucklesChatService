import { ExceptionLog } from "@/models/logger/ExceptionLog";
import { ILoggerController } from "./ILoggerController";
import { MongoService } from "@/services/mongo/MongoService";
import { v4 } from "uuid";

export class LoggerController implements ILoggerController {
    public async LogException(
        mongoService: MongoService,
        exceptionLog: ExceptionLog,
    ): Promise<boolean> {
        const id = v4();
        const result = await mongoService
            .collection(
                mongoService.db(process.env.MONGO_DB_NAME ?? ""),
                process.env.MONGO_COLLECTION_NAME ?? "",
            )
            .insertOne(exceptionLog);
    }
}
