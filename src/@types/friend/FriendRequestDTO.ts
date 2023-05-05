/**
 * Once the friend request is accepted, the row is removed from the database
 */
export type FriendRequestDTO = {
    /**
     * The target, aka the person receiving the message
     */
    username: string;
    /**
     * The custom message appended with the friend request
     */
    customMessage?: string;
    /**
     * The person who sent the request
     */
    sender: number;
    /**
     * The profile image of the sender
     */
    senderProfileImageUrl?: string;
    /**
     * The time it was created
     */
    createdAt?: Date;
};
