import { ThrottleStatus } from "../../@types/user/ThrottleStatus";
import { numericalConverter } from "../NumericalConverter/numericalConverter";

/**
 * Processes the failed attempt results, returning the locked until date if any of them qualify for meeting the criteria
 *
 * @param ipThrottleStatus - The current throttle status of the ip address
 * @param usernameThrottleStatus - The current throttle status of the username
 * @returns The updated locked until date if any of the throttling is triggered
 */
export const processFailedLoginAttempt = (
    ipThrottleStatus: ThrottleStatus,
    usernameThrottleStatus: ThrottleStatus,
): number => {
    if (
        ipThrottleStatus.failedAttempts ===
        Number(process.env.FAILED_IP_ATTEMPTS_10)
    ) {
        return Date.now() + numericalConverter.minutes.toMilliseconds(2);
    } else if (
        ipThrottleStatus.failedAttempts ===
        Number(process.env.FAILED_IP_ATTEMPTS_20)
    ) {
        return Date.now() + numericalConverter.minutes.toMilliseconds(5);
    } else if (
        ipThrottleStatus.failedAttempts ===
        Number(process.env.FAILED_IP_ATTEMPTS_30)
    ) {
        return Date.now() + numericalConverter.minutes.toMilliseconds(15);
    } else if (
        usernameThrottleStatus.failedAttempts ===
        Number(process.env.FAILED_USERNAME_ATTEMPTS_5)
    ) {
        return Date.now() + numericalConverter.minutes.toMilliseconds(5);
    } else if (
        usernameThrottleStatus.failedAttempts ===
        Number(process.env.FAILED_USERNAME_ATTEMPTS_15)
    ) {
        return Date.now() + numericalConverter.minutes.toMilliseconds(10);
    } else if (
        usernameThrottleStatus.failedAttempts ===
        Number(process.env.FAILED_USERNAME_ATTEMPTS_30)
    ) {
        return Date.now() + numericalConverter.minutes.toMilliseconds(30);
    }

    return 0;
};
