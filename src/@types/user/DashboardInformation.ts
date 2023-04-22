import { DbUser } from "./DbUser";

export type DashboardInformation = Partial<DbUser> & {
    numberOfFriends?: number;
    numberOfMessages?: number;
    friendsInformation?: Partial<DbUser>[];
};
