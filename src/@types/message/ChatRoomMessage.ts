export type ChatRoomMessage = {
    content: string;
    createdAt?: Date;
    sender: number;
    senderProfilePictureUrl?: string;
};
