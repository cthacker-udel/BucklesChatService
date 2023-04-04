import { ExceptionLog } from "src/@types/logger/ExceptionLog";
import { ApiResponse } from "src/models/api/response/ApiResponse";
import { MongoService } from "../mongo/MongoService";
import { ILoggerService } from "./ILoggerService";
import { EventLog } from "src/@types/logger/EventLog";

/**
 * Handles all business logic concerning the logger database
 */
export class LoggerService implements ILoggerService {
    /**
     * The mongo service instance, used for database actions upon the mongo database
     */
    private readonly mongoService: MongoService;

    /**
     * One-arg constructor taking in the mongo service instance
     *
     * @param _mongoService - The mongo service this logger service will be using
     */
    public constructor(_mongoService: MongoService) {
        this.mongoService = _mongoService;
    }

    /** @inheritdoc */
    public LogException = async (
        id: string,
        exceptionLog: ExceptionLog,
    ): Promise<ApiResponse<boolean>> => {
        const result = await this.mongoService
            .collection(
                this.mongoService.db(process.env.MONGO_DB_NAME ?? ""),
                process.env.MONGO_COLLECTION_NAME ?? "",
            )
            .insertOne(exceptionLog);
        return new ApiResponse<boolean>(id).setData(result.acknowledged);
    };

    /** @inheritdoc */
    public LogEvent = async (
        id: string,
        eventLog: EventLog,
    ): Promise<ApiResponse<boolean>> => {
        const result = await this.mongoService
            .collection(
                this.mongoService.db(process.env.MONGO_DB_NAME ?? ""),
                process.env.MONGO_COLLECTION_NAME ?? "",
            )
            .insertOne(eventLog);
        return new ApiResponse<boolean>(id).setData(result.acknowledged);
    };
}
