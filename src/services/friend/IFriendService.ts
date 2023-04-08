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
    add: (
        _id: string,
        _usernameTo: string,
        _usernameFrom: string,
        _customMessage?: string,
    ) => Promise<ApiResponse<boolean>>;
}
