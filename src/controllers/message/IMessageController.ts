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
     * Creates a new message in the database
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The message id of the created message
     */
    addMessage: (_request: Request, _response: Response) => Promise<void>;

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

    /**
     * Gets all the threads messages, ordering them by thread order
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns All thread messages ordered by thread order
     */
    getThreadMessages: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;

    /**
     * Gets all the threads along with their messages, ordering the messages by thread order DESC
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns All threads along with their messages
     */
    getThreadsWithMessages: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;

    /**
     * Fetches all pending direct messages for the user supplied
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns All the pending direct messages for the supplied user
     */
    pendingDirectMessages: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;

    /**
     * Creates a chat room in the database
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The id of the created chat room (-1 if failed to create)
     */
    createChatRoom: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Adds a message to the chat room
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The id of the message that was appended
     */
    addMessageToChatRoom: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;

    /**
     * Returns all of the chat rooms in the application
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns All of the chat-rooms in the application
     */
    getAllChatRooms: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Gets all the statistics for the individual chat room
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The individual chat room statistics
     */
    getChatRoomStats: (_request: Request, _response: Response) => Promise<void>;
}
