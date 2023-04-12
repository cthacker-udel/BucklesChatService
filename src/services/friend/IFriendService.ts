import { FriendRequestDTO } from "../../@types/friend/FriendRequestDTO";
import { ApiResponse } from "../../models/api/response/ApiResponse";

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
    ) => Promise<ApiResponse<FriendRequestDTO[]>>;

    /**
     * Accepts the friend request sent to the user (usernameTo)
     *
     * @param _id - The id to track the transaction
     * @param _usernameTo - The username whom received the friend request
     * @param _usernameFrom - The username where the request was coming from
     * @returns - Whether the request was successfully accepted or not
     */
    acceptRequest: (
        _id: string,
        _usernameTo: string,
        _usernameFrom: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Rejects the friend request sent to the user (usernameTo)
     *
     * @param _id - The id to track the transaction
     * @param _usernameTo - The username whom received the friend request
     * @param _usernameFrom - The username whom sent the request
     * @returns - Whether the request was successfully rejected or not
     */
    rejectRequest: (
        _id: string,
        _usernameTo: string,
        _usernameFrom: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Removes a friend from the friend list
     *
     * @param _id - The id to track the transaction
     * @param _recipient - The username whom received + accepted the friend request
     * @param _sender - The username whom sent the friend request
     * @returns - Whether the user was removed successfully
     */
    removeFriend: (
        _id: string,
        _recipient: string,
        _sender: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Checks if a friendship exists in the database
     *
     * @param _recipient - The user whom received + accepted the friend request
     * @param _sender - The user whom sent the friend request
     * @returns - Whether or not the friendship exists in the database
     */
    doesFriendshipExist: (
        _recipient: string,
        _sender: string,
    ) => Promise<boolean>;
}
