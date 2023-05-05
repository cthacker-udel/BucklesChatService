import { Request } from "express";
import { EncryptionPayload } from "../../@types/encryption/EncryptionPayload";

/**
 * Interface for all methods involving encryption, whether that be with passwords or generally any values that require encryption
 */
export interface IEncryptionService {
    /**
     * Generates a tracking id
     *
     * @returns The generated id for tracing purposes
     */
    generateId: () => string;

    /**
     * Generates the salt for hashing the value, defaults to 56 length string
     *
     * @param _saltLength - The length of the salt to generate
     * @returns The generated salt
     */
    generateSalt: (_saltLength?: number) => string;

    /**
     * Encrypts the value and returns the hashed value along with the salt used in the encryption process
     *
     * @param _value - The value to encrypt
     * @returns The encrypted value and the salt used to encrypt
     */
    hmacEncrypt: (_value: string) => EncryptionPayload;

    /**
     * Encrypts the value with fixed salt, rather then generating the salt. Used for verification when logging in
     *
     * @param _salt - The salt to apply to the value
     * @param _value - The value we are hashing
     * @returns The hashed value given the salt
     */
    fixedValueEncryption: (_salt: string, _value: string) => string;

    /**
     * Fetches the username given the request containing the jwt token
     *
     * @param _request - The request coming from the client, which contains a cookie containing the cookie
     * @returns The user id contained within that token
     */
    getUserIdFromRequest: (_request: Request) => number;
}
