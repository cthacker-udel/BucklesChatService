import type { ThreadMessage } from "./ThreadMessage";

export type ThreadWithMessages = {
    creator?: number;
    creatorUsername: string;
    creatorProfilePictureUrl?: string;
    messages: ThreadMessage[];
    receiver?: number;
    receiverProfilePictureUrl?: string;
    receiverUsername: string;
    threadId: number;
};
