/* eslint-disable implicit-arrow-linebreak -- disabled */
/* eslint-disable class-methods-use-this -- disabled */

import { EncryptionPayload } from "../../@types/encryption/EncryptionPayload";
import { IEncryptionService } from "./IEncryptionService";
import { v4 } from "uuid";
import { createHmac, randomBytes } from "node:crypto";

export class EncryptionService implements IEncryptionService {
    /** @inheritdoc */
    public generateId = (): string => v4.toString();

    /** @inheritdoc */
    public generateSalt = (saltLength = 56): string =>
        randomBytes(saltLength).toString("ascii");

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
}
