import { PsqlUser } from "../../@types/user/PsqlUser";
import { User } from "../../@types/user/User";

/**
 * Converts an local user to an PSQL compliant user, used mostly for editing user information, we need specific keys to successfully run the query
 *
 * @param partialUser - The partial user to convert to psql user
 * @returns The converted psql user
 */
export const convertPartialUserToPsqlUser = (
    partialUser: Partial<User>,
): Partial<PsqlUser> => {
    const partialPsqlUser: Partial<PsqlUser> = {};

    if (partialUser.firstName !== undefined) {
        partialPsqlUser.first_name = partialUser.firstName;
    }

    if (partialUser.lastName !== undefined) {
        partialPsqlUser.last_name = partialUser.lastName;
    }

    if (partialUser.email !== undefined) {
        partialPsqlUser.email = partialUser.email;
    }

    if (partialUser.handle !== undefined) {
        partialPsqlUser.handle = partialUser.handle;
    }

    if (partialUser.dob !== undefined) {
        partialPsqlUser.dob = partialUser.dob;
    }

    if (partialUser.username !== undefined) {
        partialPsqlUser.username = partialUser.username;
    }

    if (partialUser.password !== undefined) {
        partialPsqlUser.password = partialUser.password;
    }

    if (partialUser.passwordSalt !== undefined) {
        partialPsqlUser.password_salt = partialUser.passwordSalt;
    }

    if (partialUser.profileImageUrl !== undefined) {
        partialPsqlUser.profile_image_url = partialUser.profileImageUrl;
    }

    if (partialUser.profileImageRemovalUrl !== undefined) {
        partialPsqlUser.profile_image_removal_url =
            partialUser.profileImageRemovalUrl;
    }

    return partialPsqlUser;
};
