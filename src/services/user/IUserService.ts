import { User } from "../../@types/user/User";
import { ApiResponse } from "../../models/api/response/ApiResponse";

/**
 * Handles all business logic regarding User entities in the database
 */
export interface IUserService {
    /**
     * Checks if the username supplied to the function exists in the PSQL database
     *
     * @param _id - The id of the transaction, used for tracking purposes
     * @param _username - The username we are searching for
     * @returns Determines if the username exists in the database
     */
    doesUsernameExist: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Creates a user within the psql database
     *
     * @param _id - The id to track the transaction
     * @param _user - The user instance we are adding
     * @returns Whether the user was created successfully or not
     */
    createUser: (
        _id: string,
        _user: Partial<User>,
    ) => Promise<ApiResponse<boolean>>;
}
