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
     * Creates a user within the database
     *
     * @param _request - The client request
     * @param _response - The response to the client
     * @returns Whether the user was created successfully or not
     */
    createUser: (_request: Request, _response: Response) => Promise<void>;
}
