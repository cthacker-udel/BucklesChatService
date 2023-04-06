import { Request, Response } from "express";

/**
 * Interface for handling client requests involving the user api
 */
export interface IUserController {
    /**
     * Checks whether the supplied username exists in the database
     *
     * @param _request - The client request
     * @param _response - The response to the client
     * @returns Whether or not the username exists in the database
     */
    doesUsernameExist: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;

    /**
     * Signs a user up with the application
     *
     * @param _request - The client request
     * @param _response - The response to the client
     * @returns Whether the user was created successfully or not
     */
    signUp: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Handles the login request
     *
     * @param _request - The client request
     * @param _response - The response to the client
     * @returns Whether the user successfully logged in or not
     */
    login: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Removes a user from the database
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether the user was successfully removed or not
     */
    removeUser: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Edits a user from the database
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether the user was edited successfully or not
     */
    editUser: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Gathers the total # of users that are online
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The total # of users that are online
     */
    usersOnline: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Counts the total # of users in the entire application
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The total # of users using the application
     */
    totalUsers: (_request: Request, _response: Response) => Promise<void>;
}
