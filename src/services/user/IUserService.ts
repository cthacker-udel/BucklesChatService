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
}
