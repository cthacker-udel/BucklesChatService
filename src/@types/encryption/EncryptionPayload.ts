/**
 * The return value of encrypting the password, returns the hashed password,
 * and the salt used to hash it.
 */
export type EncryptionPayload = {
    /**
     * The hashed password
     */
    hash: string;
    /**
     * The salt used in the encryption process
     */
    salt: string;
};
