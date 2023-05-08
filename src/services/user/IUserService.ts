/* eslint-disable @typescript-eslint/indent -- disabled */
import { ActiveStatus } from "../../@types/user/ActiveStatus";
import { DashboardInformation } from "../../@types/user/DashboardInformation";
import { DbUser } from "../../@types/user/DbUser";
import { LoginResponse } from "../../@types/user/LoginResponse";
import { ThrottleStatus } from "../../@types/user/ThrottleStatus";
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
     * Checks if the friendship between the two users exists in the database
     *
     * @param _id - The id to track the transaction, used for tracking purposes
     * @param _userIdOne - The user id of the first user in the pair
     * @param _userIdTwo - The user if of the second user in the pair
     * @returns Whether or not the friendship exists in the database
     */
    doesFriendshipExist: (
        _id: string,
        _userIdOne: number,
        _userIdTwo: number,
    ) => Promise<boolean>;

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
     * @returns Whether the user logged in successfully or not, and the id of the logged in user (for session generation)
     */
    login: (
        _id: string,
        _user: Partial<DbUser>,
    ) => Promise<[ApiResponse<LoginResponse>, number]>;

    /**
     * Logs the user out (marking them as )
     *
     * @param _id - The id to track the transaction
     * @param _userId - The user id which is used to access the database
     * @param _ip - The ip address linked to the request, used for removing throttle keys
     * @returns Whether the logout operation was successful
     */
    logout: (_id: string, _userId: number, _ip: string) => Promise<boolean>;

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
     * @param _fromUserId - The id of the user who is requesting the user to be removed
     * @param _removingUserId - The user id we are using to find and delete the user
     * @returns Whether the user was successfully deleted or not
     */
    removeUser: (
        _id: string,
        _fromUserId: number,
        _removingUserId: number,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Edits a user within the database with the matching provided username
     *
     * @param _id - The id to track the transaction
     * @param _userId - The user id upon which we are doing the edits on
     * @param _userPayload - The partial fields we are updating
     * @returns - Whether the user was updated or not
     */
    editUser: (
        _id: string,
        _userId: number,
        _userPayload: Omit<
            DbUser,
            "id" | "password" | "passwordSalt" | "username"
        >,
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
     * @param _userId - The user id which allows for gathering of the information
     * @returns - The dashboard information relevant to the user
     */
    dashboardInformation: (
        _id: string,
        _userId: number,
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
     * @param _userId - The user id which is used to access the information
     * @returns - The user information relevant for editing
     */
    details: (
        _id: string,
        _userId: number,
    ) => Promise<ApiResponse<Partial<DbUser>>>;

    /**
     * Fetches the # of friends the user has
     *
     * @param _id - The id to track the transaction
     * @param _userId - The user id which is used to access the information
     * @returns - The number of friends that belong to the user specified in the `_username` argument
     */
    numberOfFriends: (
        _id: string,
        _userId: number,
    ) => Promise<ApiResponse<number>>;

    /**
     * Fetches the # of messages the user has sent
     *
     * @param _id - The id to track the transaction
     * @param _userId - The user id which is used to calculate how many messages the user has sent
     * @returns The total number of messages the user has sent
     */
    numberOfMessages: (
        _id: string,
        _userId: number,
    ) => Promise<ApiResponse<number>>;

    /**
     * Fetches all the dashboard information of all of the user's friends
     *
     * @param _id - The id to track the transaction
     * @param _userId - The user id which will be used to fetch all the friend dashboard information
     * @returns - All the friend's dashboard information
     */
    friendsDashboardInformation: (
        _id: string,
        _userId: number,
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
     * @param _userId - The user id which belongs to the user validating the email token
     * @param _confirmationToken - The confirmation token which proves this came from an email sent out
     * @returns Whether the email was confirmed
     */
    confirmEmail: (
        _id: string,
        _userId: number,
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

    /**
     * Finds the id of the user belonging to the username
     *
     * @param _username - The username which will be used for lookup
     * @returns The id of the user found
     */
    findUserIdFromUsername: (_username: string) => Promise<number | undefined>;

    /**
     * Finds the username from the given user id
     *
     * @param _userId - The user id which will be used for lookup
     * @returns - The found username of the user with the matching user id
     */
    findUsernameFromUserId: (_userId: number) => Promise<string | undefined>;

    /**
     * Refreshes the user's state within the redis database
     *
     * @param _id - The id to track the transaction
     * @param _userId - The id of the user
     * @returns Whether the state was successfully updated
     */
    refreshUserState: (
        _id: string,
        _userId: number,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Checks if the user state is still in the cache
     *
     * @param _userId - The user id used to access the key
     * @returns Whether the state is in the cache or not
     */
    isUserStateInCache: (_userId: number) => Promise<boolean>;

    /**
     * Returns the number of seconds left until the entry expires
     *
     * @param _id - The id to track the transaction
     * @param _userId - The user id used to fetch the expiration time
     * @returns
     */
    expireTimeOfUserState: (
        _id: string,
        _userId: number,
    ) => Promise<ApiResponse<ActiveStatus>>;

    /**
     * Clears the user state from the redis database (for example when the user exits the tab)
     *
     * @param _id - The id to track the transaction
     * @param _userId - The id of the user to clear the user state from the redis database
     * @returns Whether the state was removed from the redis database successfully
     */
    clearUserState: (
        _id: string,
        _userId: number,
    ) => Promise<ApiResponse<boolean>>;

    /**
     * Adds a throttle status entry into the redis database
     *
     * @param key - The key used for storing the value
     * @returns Whether the throttle status was added or not
     */
    setThrottleStatus: (_key: string) => Promise<ThrottleStatus>;

    /**
     * Gets the throttle status of the requester, if one exists in the database
     *
     * @param _ip - The ip of the requester
     * @returns The throttle status of the requester, if one exists in the redis database
     */
    getThrottleStatusIp: (_ip: string) => Promise<ThrottleStatus>;

    /**
     * Gets the throttle status of the requester, if one exists in the database
     *
     * @param _username - The username of the requester
     * @returns The throttle status of the requester, if one exists in the redis database
     */
    getThrottleStatusUsername: (_username: string) => Promise<ThrottleStatus>;

    /**
     * Increments the throttle status of the associated key in the redis database
     *
     * @param _key - The key used to update the login throttle entry in the redis database
     * @returns Whether the entry was updated
     */
    incrementThrottleStatus: (_key: string) => Promise<boolean>;

    /**
     * Evaluates whether the throttle status can be removed, based on the attempts and the time elapsed since then
     *
     * @param _key - The key used to update the login throttle entry, possibly zeroing it
     * @param _type - The type of throttle we are evaluating, used to access the attempts
     * @returns Whether the user is currently throttled or not
     */
    evaluateThrottleStatus: (
        _key: string,
        _type: "IP" | "USERNAME",
    ) => Promise<[boolean, number]>;

    /**
     * Clears the ip and username throttle keys from the redis database
     *
     * @param _id - The id to track the transaction
     * @param _userId - The user id used to access the username from the user db
     * @param _ip - The ip address to clear the ip address throttle key
     * @returns Whether the keys were deleted or not
     */
    clearThrottleKeys: (
        _id: string,
        _userId: number,
        _ip: string,
    ) => Promise<ApiResponse<[ip: boolean, username: boolean]>>;

    /**
     * Clears the supplied key from the redis database
     *
     * @param _key - The key to clear from the redis database
     * @returns Whether or not the key was deleted
     */
    clearKey: (_id: string, _key: string) => Promise<boolean>;

    /**
     * !!WARNING!!
     * Flushes the entire redis cache of all keys
     *
     * @param _id - The id to track the transaction
     * @returns Whether the entire cache was flushed
     */
    flushCache: (_id: string) => Promise<ApiResponse<boolean>>;
}
