import { EventLog } from "../../@types/logger/EventLog";
import { ExceptionLog } from "../../@types/logger/ExceptionLog";
import { ApiResponse } from "../../models/api/response/ApiResponse";

export interface ILoggerService {
    /**
     * Logs an exception in the mongo collection
     *
     * @param id - The id for the transaction used for tracing purposes
     * @param exceptionLog - The exception log being upserted into the database
     * @returns Whether the exception was logged successfully or not
     */
    LogException: (
        _id: string,
        _exceptionLog: ExceptionLog,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Logs an event in the mongo collection
     *
     * @param id - The id for the transaction used for tracing purposes
     * @param eventLog - The event log being upserted into the database
     * @returns Whether the event log was logged successfully or not
     */
    LogEvent: (
        _id: string,
        _eventLog: EventLog,
    ) => Promise<ApiResponse<boolean>>;
}
