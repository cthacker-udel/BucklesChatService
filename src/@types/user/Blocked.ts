export type Blocked = {
    /**
     * The user who is blocked
     */
    username: string;
    /**
     * The reason for the blocking
     */
    reason: string;
    /**
     * The time when the block was initiated
     */
    blocked: number;
    /**
     * The person who sent the request for block
     */
    sender: string;
};
