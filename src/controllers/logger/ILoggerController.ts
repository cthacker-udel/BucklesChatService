import { ApiResponse } from "@/models/api/response/ApiResponse";
import { EventLog } from "@/models/logger/EventLog";
import { ExceptionLog } from "@/models/logger/ExceptionLog";
import { MongoService } from "@/services/mongo/MongoService";

export interface ILoggerController {
    /**
     * Logs an exception in the mongo collection
     *
     * @param id - The id for the transaction used for tracing purposes
     * @param mongoService - The mongo service instantiated from the root application
     * @param exceptionLog - The exception log being upserted into the database
     * @returns Whether the exception was logged successfully or not
     */
    LogException: (
        _id: string,
        _mongoService: MongoService,
        _exceptionLog: ExceptionLog,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Logs an event in the mongo collection
     *
     * @param id - The id for the transaction used for tracing purposes
     * @param mongoService - The mongo service instantiated from the root application
     * @param eventLog - The event log being upserted into the database
     * @returns Whether the event log was logged successfully or not
     */
    LogEvent: (
        _id: string,
        _mongoService: MongoService,
        _eventLog: EventLog,
    ) => Promise<ApiResponse<boolean>>;
}
