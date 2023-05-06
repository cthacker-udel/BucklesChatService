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

    /**
     * Fetches the dashboard information for the user to display in their "User Info" section of the dashboard
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The dashboard information relevant to the user
     */
    dashboardInformation: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;

    /**
     * Fetches the user edit information for the user when displaying the edit modal
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The information necessary when populating the edit forms
     */
    details: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Fetches all dashboard information from multiple usernames sent through the api pipeline.
     * Requires a comma separated list of usernames in the query string
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns The dashboard information for all usernames sent in the request
     */
    bulkDashboardInformation: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;

    /**
     * Logs the user out, deleting their session
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Nothing, 204 response
     */
    logout: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Checks if the supplied email in the query string is valid
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns 200 if successfully validated, validation result in inner data
     */
    isEmailValid: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Sends a confirmation email to the user
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns 200 if successfully sent, else otherwise
     */
    confirmEmail: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Updates the current logged in user's status
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns 200 if status successfully updated in redis database
     */
    updateUserState: (_request: Request, _response: Response) => Promise<void>;

    /**
     * Gets the current time of the user's state expiration entry in the redis database
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns 200 if the status is successfully updated in the redis database
     */
    pingUserStateExpiration: (
        _request: Request,
        _response: Response,
    ) => Promise<void>;

    /**
     * Clears the user status from the redis database
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns 200 if the status was successfully cleared in the redis database
     */
    clearUserState: (_request: Request, _response: Response) => Promise<void>;
}
