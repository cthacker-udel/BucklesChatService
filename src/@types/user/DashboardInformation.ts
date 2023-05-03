/* eslint-disable @typescript-eslint/indent -- disabled */
import { DbUser } from "./DbUser";

export type DashboardInformation = Partial<{
    numberOfFriends?: number;
    numberOfMessages?: number;
    friendsInformation?: Partial<DbUser>[];
}> &
    Partial<DbUser>;
