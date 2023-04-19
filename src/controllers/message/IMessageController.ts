import { Request, Response } from "express";

export interface IMessageController {
    /**
     * Creates a new thread, using the sender and receiver, and the original message to instantiate it with
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether or not the thread was created successfully
     */
    createThread: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Gets all threads belonging to the user
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns All the threads that belong to the user
     */
    getThreads: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Removes a thread belonging to the user
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether the thread was removed or not
     */
    removeThread: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Adds a message to the thread
     *
     * @example
     * // POST https://localhost:9999/message/thread/add
     * // body: { messageId: 1, threadId: 1 }
     * // response 500, 400, or 200
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether the message was added successfully
     */
    addMessageToThread: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;
}
