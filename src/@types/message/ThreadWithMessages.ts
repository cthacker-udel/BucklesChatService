import type { ThreadMessage } from "./ThreadMessage";

export type ThreadWithMessages = {
    creator?: string;
    creatorProfilePictureUrl?: string;
    messages: ThreadMessage[];
    threadId: number;
    receiverProfilePictureUrl?: string;
    receiver?: string;
};
