/* eslint-disable @typescript-eslint/no-extraneous-class -- disabled */

import { EventLog } from "@/models/logger/EventLog";
import { ExceptionLog } from "@/models/logger/ExceptionLog";
import { MongoService } from "@/services/mongo/MongoService";

export interface ILoggerController {
    /**
     * Logs an exception in the mongo collection
     *
     * @param mongoService - The mongo service instantiated from the root application
     * @param exceptionLog - The exception log being upserted into the database
     * @returns Whether the exception was logged successfully or not
     */
    LogException: (
        mongoService: MongoService,
        exceptionLog: ExceptionLog,
    ) => Promise<boolean>;

    /**
     * Logs an event in the mongo collection
     *
     * @param mongoService - The mongo service instantiated from the root application
     * @param eventLog - The event log being upserted into the database
     * @returns Whether the event log was logged successfully or not
     */
    LogEvent: (
        mongoService: MongoService,
        eventLog: EventLog,
    ) => Promise<boolean>;
}
