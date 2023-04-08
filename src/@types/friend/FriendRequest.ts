/**
 * Once the friend request is accepted, the row is removed from the database
 */
export type FriendRequest = {
    /**
     * The target, aka the person receiving the message
     */
    username: string;
    /**
     * The custom message appended with the friend request
     */
    customMessage?: string;
    /**
     * The time it was sent
     */
    sent: number;
    /**
     * The person who sent the request
     */
    sender: string;
};
