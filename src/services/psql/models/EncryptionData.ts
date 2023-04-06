/**
 * PSQL model of the encryption data returned when querying for user's encryption data
 */
export type EncryptionData = {
    /**
     * The salt used in the encryption process
     */
    password_salt: string;
    /**
     * The hashed password
     */
    password: string;
};
