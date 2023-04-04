import { ApiErrorCodes } from "@/constants/enums/ApiErrorCodes";

/**
 * Represents an logged error in the database
 */
export class ApiErrorInfo {
    /**
     * Id of the error, allows for tracing among logs
     */
    public id: string;
    /**
     * The message of the error being logged
     */
    public message?: string;
    /**
     * The stacktrace of the exception being logged
     */
    public stack?: string;
    /**
     * The code of the error being logged, allows for custom messages on the frontend
     */
    public code?: ApiErrorCodes;

    /**
     * 1-arg 3-optional constructor to instantiate an instance of the ApiErrorInfo, which contains information
     * regarding an exception that happens in the application
     *
     * @param _id - The id used to instantiate the error info
     * @param _message - (optional) The message attached with the exception that will be logged
     * @param _stack - (optional) The stack trace attached with the exception that will be logged
     * @param _code - (optional) The error code signifying which exception is being thrown
     */
    public constructor(
        _id: string,
        _message?: string,
        _stack?: string,
        _code?: ApiErrorCodes,
    ) {
        this.id = _id;
        this.message = _message;
        this.stack = _stack;
        this.code = _code;
    }

    /**
     * Initializes the `message` and `stack` fields of the class with the exception passed in
     *
     * @param _error - The exception we are using to initialize all the fields of the class with
     * @param _code - The api error code used to stipulate what type of exception is being logged
     * @returns The modified instance of the class
     */
    public initException = (
        _error: unknown,
        _code?: ApiErrorCodes,
    ): ApiErrorInfo => {
        const convertedException = _error as Error;
        this.message = convertedException.message;
        this.stack = convertedException.stack;
        return this;
    };
}
