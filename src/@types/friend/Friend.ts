export type Friend = {
    /**
     * The recipient of the friend connection, aka the target
     */
    recipient: string;
    /**
     * The person who initially sent the friend request, aka the initiator.
     */
    sender: string;
    /**
     * The time the friend request was accepted
     */
    accepted: number;
};
