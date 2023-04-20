import type { DirectMessage } from "./DirectMessage";

export type ThreadMessage = DirectMessage & {
    thread: number;
    threadOrder: number;
};
