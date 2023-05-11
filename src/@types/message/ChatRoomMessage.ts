export type ChatRoomMessage = {
    content: string;
    createdAt?: Date;
    sender: number;
    senderHandle?: string;
    senderUsername: string;
    senderProfilePictureUrl?: string;
};
