import { ChatRoomMessage } from "../../@types/message/ChatRoomMessage";
import { ThreadMessage } from "../../@types/message/ThreadMessage";
import { ThreadWithMessages } from "../../@types/message/ThreadWithMessages";
import { DirectMessagePayload } from "../../controllers/friend/DTO/DirectMessagePayload";
import { ChatRoomStats } from "../../controllers/message/chatroomDTO/ChatRoomStats";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { ChatRoom } from "../../models/sequelize/ChatRoom";
import { Thread } from "../../models/sequelize/Thread";

export interface IMessageService {
    /**
     * Checks if a thread already exists with the initial message id
     *
     * @param _creator - The creator of the thread
     * @param _receiver - The receiver of the thread
     * @returns
     */
    doesThreadExist: (_creator: string, _receiver: string) => Promise<boolean>;

    /**
     * Creates a new thread in the database, if one already exists, then returns false
     *
     * @param _id - The id to track the transaction
     * @param _creator - The creator of the thread
     * @param _receiver - The receiver of the thread
     * @param _initialMessageId - The id of the initial message to start the thread
     * @returns The id of the thread that was created
     */
    createThread: (
        _id: string,
        _creator: string,
        _receiver: string,
    ) => Promise<ApiResponse<number>>;

    /**
     * Gets all threads that fall under the user
     *
     * @param _id - The id to track the transaction
     * @param _username - The username to fetch all the threads for
     * @returns All the threads listed under that username
     */
    getThreads: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<Thread[]>>;

    /**
     * Removes a thread from the database, ceasing + deleting all messages involved in it as well
     *
     * @param _id - The id to track the transaction
     * @param _threadId - The id of the thread to delete
     * @returns Whether the thread was deleted
     */
    removeThread: (
        _id: string,
        _threadId: number,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Adds a message to an existing thread
     *
     * @param _id - The id to track the transaction
     * @param _messageId - The id of the message to add
     * @param _threadId - The id of the thread to add the message to
     * @returns Whether the thread was deleted
     */
    addMessageToThread: (
        _id: string,
        _messageId: number,
        _threadId: number,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Fetches all the messages belonging to the thread
     *
     * @param _id - The id to track the transaction
     * @param _threadId - The id of the thread to pull the messages from
     * @returns All the messages belonging to the thread
     */
    getThreadMessages: (
        _id: string,
        _threadId: string,
    ) => Promise<ApiResponse<ThreadMessage[]>>;

    /**
     * Fetches all threads and all the messages that come with the thread as well
     *
     * @param _id - The id to track the transaction
     * @param _username - The username used to fetch all the threads, and get their respective messages
     * @returns All the threads with all their messages
     */
    getThreadsWithMessages: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<ThreadWithMessages[]>>;

    /**
     * Adds a message into the database
     *
     * @param _id - The id to track the transaction
     * @param _payload - The message contents we are adding into the database
     * @returns The id of the added message, or -1 if it was not added successfully
     */
    addMessage: (
        _id: string,
        _payload: DirectMessagePayload,
    ) => Promise<ApiResponse<number>>;

    /**
     * Fetches all pending direct messages for the user matching the username supplied in the `username` parameter
     *
     * @param _id - The id to track the transaction
     * @param _username - The username to fetch the pending direct messages from
     * @returns All the pending direct messages for the user
     */
    pendingDirectMessages: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<DirectMessagePayload[]>>;

    /**
     * Finds the sender's profile picture url
     *
     * @param _id - The id to track the transaction
     * @param _username - The username used to lookup the sender profile picture url
     * @returns The profile picture url of the sender
     */
    findSenderProfilePictureUrl: (
        _id: string,
        _username: string,
    ) => Promise<string | undefined>;

    /**
     * Creates a chat room in the database
     *
     * @param _id - The id to track the transaction
     * @param
     * @returns - The id of the created chat room (-1 if not created)
     */
    createChatRoom: (
        _id: string,
        _createdBy: string,
        _name: string,
        _description?: string,
    ) => Promise<ApiResponse<number>>;

    /**
     * Adds a message to the chat room
     * @param _id - The id to track the transaction
     * @param _messageId - The id of the message to append to the chat room
     * @param _chatRoomId - The id of the chat room that will be having a message appended to it
     * @returns The partial object of the chat room message that was appended
     */
    addMessageToChatRoom: (
        _id: string,
        _messageId: number,
        _chatRoomId: number,
    ) => Promise<ApiResponse<Partial<ChatRoomMessage>>>;

    /**
     * Gets all chat-rooms in the application
     *
     * @param _id - The id to track the transaction
     * @returns - All chat-rooms in the application
     */
    getAllChatRooms: (_id: string) => Promise<ApiResponse<ChatRoom[]>>;

    /**
     * Gets the chat room statistics for the matching chat room who's id was passed in
     *
     * @param _id - The id to track the transaction
     * @param _chatRoomId - The id of the chat room used for lookup
     * @returns The chat room stats of the chat room associated with that id
     */
    getChatRoomStats: (
        _id: string,
        _chatRoomId: number,
    ) => Promise<ApiResponse<ChatRoomStats>>;

    /**
     * Gets all the chat room messages associated with the chat room
     *
     * @param _id - The id to track the transaction
     * @param _chatRoomId - The id of the chat room used for finding all the associated messages
     * @returns All of the chat room's messages
     */
    getChatRoomMessages: (
        _id: string,
        _chatRoomId: number,
    ) => Promise<ApiResponse<ChatRoomMessage[]>>;
}
