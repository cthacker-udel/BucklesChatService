export interface IEmailService {
    /**
     * Checks if the supplied email is valid
     *
     * @param _email - The email to check
     * @param _source - The source of where this validation is coming from
     * @returns Whether the email is a valid email or not
     */
    isEmailValid: (_email: string, _source: string) => Promise<boolean>;
}
