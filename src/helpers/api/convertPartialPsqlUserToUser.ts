/* eslint-disable no-extra-boolean-cast -- disabled */
import { PsqlUser } from "../../@types/user/PsqlUser";
import { DbUser } from "../../@types/user/DbUser";

/**
 * Converts a partial psql user to a partial user
 *
 * @param partialPsqlUser - The partial psql user
 * @returns The partial user equivalent of the passed in partial psql user
 */
export const convertPartialPsqlUserToUser = (
    partialPsqlUser: Partial<PsqlUser>,
): Partial<DbUser> => {
    const partialUser: Partial<DbUser> = {};

    if (Boolean(partialPsqlUser.first_name)) {
        partialUser.firstName = partialPsqlUser.first_name;
    }

    if (Boolean(partialPsqlUser.last_name)) {
        partialUser.lastName = partialPsqlUser.last_name;
    }

    if (Boolean(partialPsqlUser.email)) {
        partialUser.email = partialPsqlUser.email;
    }

    if (Boolean(partialPsqlUser.handle)) {
        partialUser.handle = partialPsqlUser.handle;
    }

    if (partialPsqlUser.dob !== null) {
        partialUser.dob = partialPsqlUser.dob;
    }

    if (Boolean(partialPsqlUser.username)) {
        partialUser.username = partialPsqlUser.username;
    }

    if (Boolean(partialPsqlUser.password)) {
        partialUser.password = partialPsqlUser.password;
    }

    if (Boolean(partialPsqlUser.profile_image_url)) {
        partialUser.profileImageUrl = partialPsqlUser.profile_image_url;
    }

    if (Boolean(partialPsqlUser.profile_image_removal_url)) {
        partialUser.profileImageRemovalUrl =
            partialPsqlUser.profile_image_removal_url;
    }

    if (partialPsqlUser.creation_date !== null) {
        partialUser.creationDate = partialPsqlUser.creation_date;
    }

    if (Boolean(partialPsqlUser.password_salt)) {
        partialUser.passwordSalt = partialPsqlUser.password_salt;
    }

    return partialUser;
};
