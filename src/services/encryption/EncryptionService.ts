/* eslint-disable implicit-arrow-linebreak -- disabled */
/* eslint-disable class-methods-use-this -- disabled */

import { EncryptionPayload } from "../../@types/encryption/EncryptionPayload";
import { IEncryptionService } from "./IEncryptionService";
import { v4 } from "uuid";
import { createHmac, randomBytes } from "node:crypto";
import { Request } from "express";
import { verify } from "jsonwebtoken";
import { SessionToken } from "../../@types/encryption/SessionToken";
import { cookieKey } from "../../constants/cookie/cookieKey";

/**
 * Service involving encryption, whether that be with passwords or generally any values that require encryption
 */
export class EncryptionService implements IEncryptionService {
    /** @inheritdoc */
    public generateId = (): string => v4.toString();

    /** @inheritdoc */
    public generateSalt = (saltLength = 56): string =>
        randomBytes(saltLength).toString("hex");

    /** @inheritdoc */
    public hmacEncrypt = (value: string): EncryptionPayload => {
        const generatedSalt = this.generateSalt();
        const hmacAlgo = createHmac("sha256", generatedSalt);
        const hashedData = hmacAlgo.update(value);
        const generatedHash = hashedData.digest("hex");

        return {
            hash: generatedHash,
            salt: generatedSalt,
        };
    };

    /** @inheritdoc */
    public fixedValueEncryption = (salt: string, value: string): string => {
        const hmacAlgo = createHmac("sha256", salt);
        const hashedData = hmacAlgo.update(value);
        return hashedData.digest("hex");
    };

    /** @inheritdoc */
    public getUsernameFromRequest = (request: Request): number => {
        const token = request.cookies[cookieKey] as string;

        const decoded = verify(
            token,
            process.env.TOKEN_SECRET as string,
        ) as SessionToken;

        return decoded.userId;
    };
}
