/* eslint-disable implicit-arrow-linebreak -- disabled */
/* eslint-disable no-confusing-arrow -- disabled */

const stringColumns = ["first_name", "last_name", "email", "handle"];

/**
 * Converts the value associated with the key, to a string representing it's value in PSQL syntax
 *
 * @param key - The key to dictate how the value is treated
 * @param value - The value we are converting to psql compliance
 * @returns The converted value
 */
export const convertUserKeyToPsqlValue = (key: string, value: any) =>
    stringColumns.includes(key) ? `'${value}'` : `${value}`;
