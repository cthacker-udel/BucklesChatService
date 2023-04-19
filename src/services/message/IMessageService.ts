import { ApiResponse } from "../../models/api/response/ApiResponse";
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
     * @returns Whether or not the thread was completed successfully
     */
    createThread: (
        _id: string,
        _creator: string,
        _receiver: string,
    ) => Promise<ApiResponse<boolean>>;

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
}
