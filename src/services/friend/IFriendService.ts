import { ApiResponse } from "../../models/api/response/ApiResponse";
import { FriendRequest } from "../../models/sequelize/FriendRequest";

export interface IFriendService {
    /**
     * Verifies if the friend request already exists in the database
     *
     * @param _usernameTo - The username receiving the request
     * @param _usernameFrom - The username sending the request
     * @returns Whether or not the friend request already exists in the database
     */
    doesFriendRequestExist: (
        _usernameTo: string,
        _usernameFrom: string,
    ) => Promise<boolean>;

    /**
     * Attempts to send a friend request from usernameFrom, to usernameTo
     *
     * @param _id - The id to track the transaction
     * @param _usernameTo - The username which is receiving the friend request
     * @param _usernameFrom - The username which is sending the friend request
     * @param _customMessage - The custom message which we are sending along with the friend request
     * @returns - Whether or not the friend request was successful
     */
    sendRequest: (
        _id: string,
        _usernameTo: string,
        _usernameFrom: string,
        _customMessage?: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Finds all friends available for request
     *
     * @param _id - The id to track the transaction
     * @param _username - The username which is requesting the available friends from
     * @returns - The list of friends available for request
     */
    availableFriends: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<string[]>>;

    /**
     * Gets all pending friend requests for the user specified
     *
     * @param _id - The id to track the transaction
     * @param _username - the username which is requesting to fetch all of it's pending friend requests
     * @returns - The list of pending friend requests
     */
    pendingRequests: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<FriendRequest[]>>;
}
