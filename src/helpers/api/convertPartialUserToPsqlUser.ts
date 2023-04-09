/* eslint-disable no-extra-boolean-cast -- disabled */
import { PsqlUser } from "../../@types/user/PsqlUser";
import { DbUser } from "../../@types/user/DbUser";

/**
 * Converts an local user to an PSQL compliant user, used mostly for editing user information, we need specific keys to successfully run the query
 *
 * @param partialUser - The partial user to convert to psql user
 * @returns The converted psql user
 */
export const convertPartialUserToPsqlUser = (
    partialUser: Partial<DbUser>,
): Partial<PsqlUser> => {
    const partialPsqlUser: Partial<PsqlUser> = {};

    if (Boolean(partialUser.firstName)) {
        partialPsqlUser.first_name = partialUser.firstName;
    }

    if (Boolean(partialUser.lastName)) {
        partialPsqlUser.last_name = partialUser.lastName;
    }

    if (Boolean(partialUser.email)) {
        partialPsqlUser.email = partialUser.email;
    }

    if (Boolean(partialUser.handle)) {
        partialPsqlUser.handle = partialUser.handle;
    }

    if (Boolean(partialUser.dob)) {
        partialPsqlUser.dob = partialUser.dob;
    }

    if (Boolean(partialUser.username)) {
        partialPsqlUser.username = partialUser.username;
    }

    if (Boolean(partialUser.password)) {
        partialPsqlUser.password = partialUser.password;
    }

    if (Boolean(partialUser.passwordSalt)) {
        partialPsqlUser.password_salt = partialUser.passwordSalt;
    }

    if (Boolean(partialUser.profileImageUrl)) {
        partialPsqlUser.profile_image_url = partialUser.profileImageUrl;
    }

    if (Boolean(partialUser.profileImageRemovalUrl)) {
        partialPsqlUser.profile_image_removal_url =
            partialUser.profileImageRemovalUrl;
    }

    if (Boolean(partialUser.creationDate)) {
        partialPsqlUser.creation_date = partialUser.creationDate;
    }

    return partialPsqlUser;
};
