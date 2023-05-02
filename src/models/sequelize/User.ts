/* eslint-disable @typescript-eslint/indent -- disabled */

import {
    Model,
    InferAttributes,
    InferCreationAttributes,
} from "@sequelize/core";

export class User extends Model<
    InferAttributes<User>,
    InferCreationAttributes<User>
> {
    declare firstName?: string;
    declare lastName?: string;
    declare email?: string;
    declare handle?: string;
    declare dob?: number;
    declare username: string;
    declare password: string;
    declare passwordSalt: string;
    declare profileImageUrl?: string;
    declare profileImageRemovalUrl?: string;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare id?: number;
    declare isEmailConfirmed?: boolean;
    declare emailConfirmationToken?: string;
}
