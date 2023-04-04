/**
 * Log of when an exception occurred
 */
export type ExceptionLog = {
    /**
     * The id used for tracing the log across processes
     */
    id: string;
    /**
     * The message associated with the exception logged
     */
    message?: string;
    /**
     * The stacktrace of the exception logged
     */
    stackTrace?: string;
    /**
     * The timestamp of when the error occurred
     */
    timestamp?: number;
};
