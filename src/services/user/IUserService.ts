import { DashboardInformation } from "../../@types/user/DashboardInformation";
import { DbUser } from "../../@types/user/DbUser";
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
    findUserEncryptionData: (_username: string) => Promise<Partial<DbUser>>;

    /**
     * Attempts to log the user in
     *
     * @param _id - The id to track the transaction
     * @param _user - The user instance we are adding
     * @returns Whether the user logged in successfully or not
     */
    login: (
        _id: string,
        _user: Partial<DbUser>,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Attempts to sign the user up in the database
     *
     * @param _id - The id to track the transaction
     * @param _user - The user instance we are signing up
     * @returns Whether the user signed up successfully or not
     */
    signUp: (
        _id: string,
        _user: Partial<DbUser>,
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
        _userPayload: DbUser,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Returns the total # of users online
     *
     * @param _id - The id to track the transaction
     * @returns - The total # of users that are online and using the service
     */
    usersOnline: (_id: string) => Promise<ApiResponse<number>>;

    /**
     * Returns the total # of users in the entire application
     *
     * @param _id - The id to track the transaction
     * @returns - The total # of users in the entire application
     */
    totalUsers: (_id: string) => Promise<ApiResponse<number>>;

    /**
     * Fetches the dashboard information for the user sending the request
     *
     * @param _id - The id to track the transaction
     * @param _username - The username which allows for gathering of the information
     * @returns - The dashboard information relevant to the user
     */
    dashboardInformation: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<DashboardInformation>>;

    /**
     * Fetches the dashboard information for all usernames sent through in query string
     *
     * @param _id - The id to track the transaction
     * @param _usernames - The usernames of all the users who we are acquiring their respective dashboard information
     * @returns - The dashboard information relevant to all the users sent in the GET request's query string
     */
    bulkDashboardInformation: (
        _id: string,
        _usernames: string[],
    ) => Promise<ApiResponse<DashboardInformation[]>>;

    /**
     * Fetches the user information relevant for editing from the database
     *
     * @param _id - The id to track the transaction
     * @param _username - The username which is used to access the information
     * @returns - The user information relevant for editing
     */
    details: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<Partial<DbUser>>>;

    /**
     * Fetches the # of friends the user has
     *
     * @param _id - The id to track the transaction
     * @param _username - The username which is used to access the information
     * @returns - The number of friends that belong to the user specified in the `_username` argument
     */
    numberOfFriends: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<number>>;

    /**
     * Fetches the # of messages the user has sent
     *
     * @param _id - The id to track the transaction
     * @param _username - The username which is used to calculate how many messages the user has sent
     * @returns The total number of messages the user has sent
     */
    numberOfMessages: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<number>>;

    /**
     * Fetches all the dashboard information of all of the user's friends
     *
     * @param _id - The id to track the transaction
     * @param _username - The username which will be used to fetch all the friend dashboard information
     * @returns - All the friend's dashboard information
     */
    friendsDashboardInformation: (
        _id: string,
        _username: string,
    ) => Promise<ApiResponse<DashboardInformation[]>>;

    /**
     * Checks if a supplied email is valid
     *
     * @param _id - The id to track the transaction
     * @param _email - The email which will be validated
     * @returns - Whether the email is valid
     */
    isEmailValid: (
        _id: string,
        _email: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Sends a welcome email to the user who just added that email to their account
     *
     * @param _id - the id to track the transaction
     * @param _email - The email which will be sent the welcome email
     * @returns - Whether the welcome email was sent or not
     */
    sendWelcomeEmail: (
        _id: string,
        _email: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Confirms the user's email, allowing them to receive emails
     *
     * @param _id - The id to track the transaction
     * @param _username - The username which belongs to the user validating the email token
     * @param _confirmationToken - The confirmation token which proves this came from an email sent out
     * @returns Whether the email was confirmed
     */
    confirmEmail: (
        _id: string,
        _username: string,
        _confirmationToken: string,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Sends a confirmation email to the passed in email
     *
     * @param _id - The id to track the transaction
     * @param _email - The email which will be sent the confirmation email
     * @returns - Whether the confirmation email was sent or not
     */
    sendConfirmationEmail: (
        _id: string,
        _email: string,
    ) => Promise<ApiResponse<boolean>>;
}
