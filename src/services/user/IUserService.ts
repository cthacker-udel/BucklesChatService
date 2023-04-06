import { PsqlUser } from "../../@types/user/PsqlUser";
import { User } from "../../@types/user/User";
import { ApiResponse } from "../../models/api/response/ApiResponse";
import { EncryptionData } from "../psql/models/EncryptionData";

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
     * @param _username - The username we are adding to the database
     * @param _password - The password we are adding to the database
     * @param _passwordSalt - The password salt we are adding to the database
     * @returns Whether the user was created successfully or not
     */
    createUser: (
        _id: string,
        _username: string,
        _password: string,
        _passwordSalt: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Finds the user encryption data given the username
     *
     * @param _username - The username which is used to lookup the user from the database
     * @returns The found encryption salt and password, and throws an exception if none is found
     */
    findUserEncryptionData: (
        _username: string,
    ) => Promise<Partial<EncryptionData>>;

    /**
     * Attempts to log the user in
     *
     * @param _id - The id to track the transaction
     * @param _user - The user instance we are adding
     * @returns Whether the user logged in successfully or not
     */
    login: (_id: string, _user: Partial<User>) => Promise<ApiResponse<boolean>>;

    /**
     * Attempts to sign the user up in the database
     *
     * @param _id - The id to track the transaction
     * @param _user - The user instance we are signing up
     * @returns Whether the user signed up successfully or not
     */
    signUp: (
        _id: string,
        _user: Partial<User>,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Attempts to remove a user from the database
     *
     * @param _id - The id to track the transaction
     * @param _username - The username we are using to find and delete the user
     * @returns Whether the user was successfully deleted or not
     */
    removeUser: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Edits a user within the database with the matching provided username
     *
     * @param _id - The id to track the transaction
     * @param _username - The user upon which we are doing the edits on
     * @param _userPayload - The partial fields we are updating
     * @returns - Whether the user was updated or not
     */
    editUser: (
        _id: string,
        _username: string,
        _userPayload: Partial<PsqlUser>,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Returns the total # of users online
     *
     * @param _id - The id to track the transaction
     * @returns - The total # of users that are online and using the service
     */
    usersOnline: (_id: string) => Promise<ApiResponse<number>>;
}
