import { DbUser } from "./DbUser";

export type DashboardInformation = Partial<DbUser> & {
    numberOfFriends?: number;
    friendsInformation?: Partial<DbUser>[];
};
