export type DirectMessagePayload = {
    content: string;
    receiver: number;
    sender: number;
    senderProfilePictureUrl?: string;
};
