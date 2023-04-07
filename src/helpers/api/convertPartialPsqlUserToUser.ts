import { PsqlUser } from "../../@types/user/PsqlUser";
import { User } from "../../@types/user/User";

/**
 * Converts a partial psql user to a partial user
 *
 * @param partialPsqlUser - The partial psql user
 * @returns The partial user equivalent of the passed in partial psql user
 */
export const convertPartialPsqlUserToUser = (
    partialPsqlUser: Partial<PsqlUser>,
): Partial<User> => {
    const partialUser: Partial<User> = {};

    if (partialPsqlUser.first_name !== undefined) {
        partialUser.firstName = partialPsqlUser.first_name;
    }

    if (partialPsqlUser.last_name !== undefined) {
        partialUser.lastName = partialPsqlUser.last_name;
    }

    if (partialPsqlUser.email !== undefined) {
        partialUser.email = partialPsqlUser.email;
    }

    if (partialPsqlUser.handle !== undefined) {
        partialUser.handle = partialPsqlUser.handle;
    }

    if (partialPsqlUser.dob !== undefined) {
        partialUser.dob = partialPsqlUser.dob;
    }

    if (partialPsqlUser.username !== undefined) {
        partialUser.username = partialPsqlUser.username;
    }

    if (partialPsqlUser.password !== undefined) {
        partialUser.password = partialPsqlUser.password;
    }

    if (partialPsqlUser.profile_image_url !== undefined) {
        partialUser.profileImageUrl = partialPsqlUser.profile_image_url;
    }

    if (partialPsqlUser.profile_image_removal_url !== undefined) {
        partialUser.profileImageRemovalUrl =
            partialPsqlUser.profile_image_removal_url;
    }

    if (partialPsqlUser.creation_date !== undefined) {
        partialUser.creationDate = partialPsqlUser.creation_date;
    }

    if (partialPsqlUser.password_salt !== undefined) {
        partialUser.passwordSalt = partialPsqlUser.password_salt;
    }

    return partialUser;
};
