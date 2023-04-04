import { Request, Response } from "express";

export interface ILoggerController {
    /**
     * Logs an exception in the mongo collection
     *
     * @param _request - The client request
     * @param _response - The response sent to the client
     * @returns Whether the exception was logged successfully or not
     */
    LogException: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Logs an event in the mongo collection
     *
     * @param _request - The client request
     * @param _response - The response sent to the client
     * @returns Whether the event log was logged successfully or not
     */
    LogEvent: (_request: Request, _response: Response) => Promise<void>;
}
