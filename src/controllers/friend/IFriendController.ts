import { Request, Response } from "express";

export interface IFriendController {
    /**
     * Attempts to add a user, aka sending a friend request to the specified user
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The information necessary when populating the edit forms
     */
    add: (_request: Request, _response: Response) => Promise<void>;
}
