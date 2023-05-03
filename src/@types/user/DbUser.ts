/* eslint-disable @typescript-eslint/indent -- disabled */
import { User } from "../../models/sequelize/User";

export type DbUser = Partial<
    Pick<
        User,
        | "createdAt"
        | "dob"
        | "email"
        | "emailConfirmationToken"
        | "firstName"
        | "handle"
        | "id"
        | "isEmailConfirmed"
        | "lastName"
        | "password"
        | "passwordSalt"
        | "profileImageRemovalUrl"
        | "profileImageUrl"
        | "updatedAt"
        | "username"
    >
>;
