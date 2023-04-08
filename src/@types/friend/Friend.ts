export type Friend = {
    /**
     * The recipient of the friend connection, aka the target
     */
    recipient: string;
    /**
     * The person receiving the friendship, aka the initiator
     */
    receiver: string;
    /**
     * The time the friend request was accepted
     */
    accepted: number;
};
