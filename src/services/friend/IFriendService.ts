/* eslint-disable @typescript-eslint/indent -- disabled */
import { FriendRequestDTO } from "../../@types/friend/FriendRequestDTO";
import { DirectMessagePayload } from "../../controllers/friend/DTO/DirectMessagePayload";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { User } from "../../models/sequelize/User";

export interface IFriendService {
    /**
     * Verifies if the friend request already exists in the database
     *
     * @param _idTo - The id of the user receiving the request
     * @param _idFrom - The id of the user sending the request
     * @returns Whether or not the friend request already exists in the database
     */
    doesFriendRequestExist: (
        _idTo: number,
        _idFrom: number,
    ) => Promise<boolean>;

    /**
     * Attempts to send a friend request from usernameFrom, to usernameTo
     *
     * @param _id - The id to track the transaction
     * @param _userToId - The user id which is receiving the friend request
     * @param _userFromId - The user id which is sending the friend request
     * @param _customMessage - The custom message which we are sending along with the friend request
     * @returns - Whether or not the friend request was successful
     */
    sendRequest: (
        _id: string,
        _userToId: number,
        _userFromId: number,
        _customMessage?: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Finds all friends available for request
     *
     * @param _id - The id to track the transaction
     * @param _userId - The user id which is requesting the available friends from
     * @returns - The list of friends available for request
     */
    availableFriends: (
        _id: string,
        _userId: number,
    ) => Promise<
        ApiResponse<
            Pick<
                User,
                "createdAt" | "handle" | "id" | "profileImageUrl" | "username"
            >[]
        >
    >;

    /**
     * Gets all pending friend requests for the user specified
     *
     * @param _id - The id to track the transaction
     * @param _userId - the user id which is requesting to fetch all of it's pending friend requests
     * @returns - The list of pending friend requests
     */
    pendingRequests: (
        _id: string,
        _userId: number,
    ) => Promise<ApiResponse<FriendRequestDTO[]>>;

    /**
     * Accepts the friend request sent to the user (usernameTo)
     *
     * @param _id - The id to track the transaction
     * @param _userIdTo - The user id whom received the friend request
     * @param _userIdFrom - The user id where the request was coming from
     * @returns - Whether the request was successfully accepted or not
     */
    acceptRequest: (
        _id: string,
        _userIdTo: number,
        _userIdFrom: number,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Rejects the friend request sent to the user (usernameTo)
     *
     * @param _id - The id to track the transaction
     * @param _userIdTo - The user id whom received the friend request
     * @param _userIdFrom - The user id whom sent the request
     * @returns - Whether the request was successfully rejected or not
     */
    rejectRequest: (
        _id: string,
        _userIdTo: number,
        _userIdFrom: number,
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
        _recipient: number,
        _sender: number,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Checks if a friendship exists in the database
     *
     * @param _recipient - The user whom received + accepted the friend request
     * @param _sender - The user whom sent the friend request
     * @returns - Whether or not the friendship exists in the database
     */
    doesFriendshipExist: (
        _recipient: number,
        _sender: number,
    ) => Promise<boolean>;

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
}
