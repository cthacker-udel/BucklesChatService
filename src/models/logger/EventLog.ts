/**
 * An log of an event that occurred, not necessarily an error, but just an event that occurred
 */
export type EventLog = {
    /**
     * The id used for tracing
     */
    id?: string;
    /**
     * The type of event being logged
     */
    type?: string;
    /**
     * The message of the event being logged
     */
    message?: string;
    /**
     * The timestamp of when the event occurred
     */
    timestamp?: number;
};
