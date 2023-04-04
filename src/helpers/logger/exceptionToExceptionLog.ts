import { ExceptionLog } from "../../@types/logger/ExceptionLog";

export const exceptionToExceptionLog = (
    error: unknown,
    id: string,
): ExceptionLog => {
    const convertedException: Error = error as Error;
    return {
        id,
        message: convertedException.message,
        stackTrace: convertedException.stack,
        timestamp: Date.now(),
    };
};
