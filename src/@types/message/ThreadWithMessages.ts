import type { ThreadMessage } from "./ThreadMessage";

export type ThreadWithMessages = {
    creator?: number;
    creatorUsername: string;
    creatorHandle?: string;
    creatorProfilePictureUrl?: string;
    messages: ThreadMessage[];
    receiver?: number;
    receiverProfilePictureUrl?: string;
    receiverUsername: string;
    receiverHandle?: string;
    threadId: number;
};
