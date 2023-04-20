import type { ThreadMessage } from "./ThreadMessage";

export type ThreadWithMessages = {
    creatorProfilePictureUrl: string;
    messages: ThreadMessage[];
    threadId: number;
    receiverProfilePictureUrl: string;
};
