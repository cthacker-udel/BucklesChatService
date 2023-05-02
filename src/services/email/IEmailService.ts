/* eslint-disable @typescript-eslint/indent -- disabled */
import type { MailDataRequired } from "@sendgrid/mail";

export interface IEmailService {
    /**
     * Checks if the supplied email is valid using multiple different apis if one is down
     *
     * @param _email - The email to check
     * @param _source - The source of where this validation is coming from
     * @returns Whether the email is a valid email or not
     */
    isEmailValid: (_email: string, _source: string) => Promise<boolean>;

    /**
     * Sends a email to the to email specified in the argument, and using the template id, allows for arguments to be passed to the email
     *
     * @param _payload - The email payload we are using to send the email, omitting from because that is already populated via environment variable
     * @returns Whether the email was sent successfully
     */
    sendEmail: (
        _payload: Omit<MailDataRequired, "from" | "replyTo"> &
            Partial<Pick<MailDataRequired, "from" | "replyTo">>,
    ) => Promise<boolean>;
}
