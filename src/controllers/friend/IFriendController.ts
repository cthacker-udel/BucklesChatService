import { Request, Response } from "express";

export interface IFriendController {
    /**
     * Attempts to add a user, aka sending a friend request to the specified user
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The information necessary when populating the edit forms
     */
    sendRequest: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Attempts to find all the available friends for the user
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The available friends for the user
     */
    availableFriends: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Gets all pending requests for the specified user
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns All the pending friend requests
     */
    pendingRequests: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Accepts a friend request
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether the request was successfully accepted or not
     */
    acceptRequest: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Rejects a friend request
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether or not the request was successfully rejected
     */
    rejectRequest: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Removes a friend
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether or not the friend was removed successfully
     */
    removeFriend: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Sends a direct message to a user
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether or not the friend was sent the message successfully
     */
    sendDirectMessage: (
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
}
