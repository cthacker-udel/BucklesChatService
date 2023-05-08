/**
 * Numerical converter, takes in the base (milliseconds, seconds, minutes) and converts it to the property selected (minutes, seconds, milliseconds)
 */
export const numericalConverter = {
    /**
     * Milliseconds numerical converter
     */
    milliseconds: {
        /**
         * Converts milliseconds to minutes
         *
         * @param amount - The amount of milliseconds to convert to minutes
         * @returns The total amount of minutes from the given milliseconds
         */
        toMinutes: (amount: number) => Math.round(amount / 1000 / 60),
        /**
         * Converts milliseconds to seconds
         *
         * @param amount - The amount of milliseconds to convert to seconds
         * @returns The total amount of seconds from the given milliseconds
         */
        toSeconds: (amount: number) => Math.round(amount / 1000),
    },
    /**
     * Minutes numerical converter
     */
    minutes: {
        /**
         * Converts minutes to milliseconds
         *
         * @param amount - The amount of minutes to convert to milliseconds
         * @returns The total amount of milliseconds from the given minutes
         */
        toMilliseconds: (amount: number) => Math.round(amount * 60 * 1000),
        /**
         * Converts minutes to seconds
         *
         * @param amount - The amount of minutes to convert to seconds
         * @returns The total amount of seconds from the given minutes
         */
        toSeconds: (amount: number) => Math.round(amount * 60),
    },
    /**
     * Seconds numerical converter
     */
    seconds: {
        /**
         * Converts seconds to milliseconds
         *
         * @param amount - The amount of seconds to convert to milliseconds
         * @returns The total amount of milliseconds from the given seconds
         */
        toMilliseconds: (amount: number) => Math.round(amount * 1000),
        /**
         * Converts seconds to minutes
         *
         * @param amount - The amount of seconds to convert to minutes
         * @returns The total amount of minutes from the given seconds
         */
        toMinutes: (amount: number) => Math.round(amount / 60),
    },
};
