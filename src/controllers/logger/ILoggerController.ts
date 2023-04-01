/* eslint-disable @typescript-eslint/no-extraneous-class -- disabled */

import { ExceptionLog } from "@/models/logger/ExceptionLog";
import { MongoService } from "@/services/mongo/MongoService";

export abstract class ILoggerController {
    static LogException: (
        mongoService: MongoService,
        exceptionLog: ExceptionLog,
    ) => Promise<boolean>;
}
