import { ApiResponse } from "../../models/api/response/ApiResponse";

export interface IUserController {
    /**
     * Checks whether the supplied username exists in the database
     *
     * @param _id - The id of the transaction, for tracing purposes
     * @param _username - The username to analyze if it exists
     * @returns Whether or not the username exists in the database
     */
    doesUsernameExist: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<boolean>>;
}
