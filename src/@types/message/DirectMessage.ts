export type DirectMessage = {
    content: string;
    createdAt: Date;
    id: number;
    receiver: number;
    sender: number;
    senderUsername?: string;
    senderHandle?: string;
    senderProfilePictureUrl?: string;
};
