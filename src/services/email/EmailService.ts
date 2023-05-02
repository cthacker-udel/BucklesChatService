/* eslint-disable @typescript-eslint/indent -- disabled */
import { Client } from "@sendgrid/client";
import { IEmailService } from "./IEmailService";
import { SendgridEmailValidationResult } from "../../@types/user/SendgridEmailValidationResult";
import { MailboxValidationResult } from "../../@types/user/MailboxLayerValidationResult";
import { AbstractValidationResult } from "../../@types/user/AbstractValidationResult";
import { HunterValidationResult } from "../../@types/user/HunterValidationResult";
import { type MailDataRequired, MailService } from "@sendgrid/mail";

export class EmailService implements IEmailService {
    /**
     * The sendgrid client which is used to make requests
     */
    private readonly client: Client;

    /**
     * The sendgrid mail service client, used to send emails
     */
    private readonly mailClient: MailService;

    /**
     * One-arg constructor that takes in an instance of the sendgrid client to instantiate it's private field with that instance
     *
     * @param _client - The client passed in from the base application to populate the inner client which is used to make requests to the API
     */
    public constructor() {
        this.client = new Client();
        this.client.setApiKey(process.env.SENDGRID_API_KEY as string);
        this.mailClient = new MailService();
        this.mailClient.setApiKey(process.env.SENDGRID_API_KEY as string);
        this.mailClient.setClient(this.client);
        this.mailClient.setTimeout(6000);
    }

    /** @inheritdoc */
    public isEmailValid = async (email: string): Promise<boolean> => {
        // try sendgrid
        try {
            const [response] = await this.client.request({
                body: JSON.stringify({ email }),
                method: "POST",
                url: "/v3/validations/email",
            });

            const convertedResponse =
                response.body as SendgridEmailValidationResult;
            return convertedResponse.result.verdict === "Valid";
        } catch {
            // try hunter
            try {
                const hunterResponse = await fetch(
                    `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${process.env.HUNTER_IO_API_KEY}`,
                );

                const hunterResponseJSON = await hunterResponse.json();
                return (
                    (hunterResponseJSON as HunterValidationResult).data
                        .result !== "undeliverable"
                );
            } catch {
                // try mailbox layer
                try {
                    const mailboxLayerResponse = await fetch(
                        `https://api.apilayer.com/email_verification/check?email=${email}`,
                        {
                            headers: {
                                apikey: process.env
                                    .MAILBOX_LAYER_API_KEY as string,
                            },
                            method: "GET",
                            redirect: "follow",
                        },
                    );
                    const mailboxResponseJSON =
                        await mailboxLayerResponse.json();
                    return (
                        (mailboxResponseJSON as MailboxValidationResult).score >
                        0
                    );
                } catch {
                    // try abstract
                    try {
                        const abstractResponse = await fetch(
                            `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`,
                        );
                        const abstractResponseJSON =
                            await abstractResponse.json();
                        return (
                            (abstractResponseJSON as AbstractValidationResult)
                                .deliverability !== "UNDELIVERABLE"
                        );
                    } catch {
                        // return false, failsafe option
                        return false;
                    }
                }
            }
        }
    };

    /** @inheritdoc */
    public sendEmail = async (
        payload: Omit<MailDataRequired, "from"> &
            Partial<Pick<MailDataRequired, "from">>,
    ): Promise<boolean> => {
        payload.from = {
            email: process.env.FROM_EMAIL as string,
            name: process.env.FROM_EMAIL_NAME,
        };
        payload.replyTo = { ...payload.from };

        const [sendEmailResponse] = await this.mailClient.send(
            payload as unknown as MailDataRequired,
        );

        return sendEmailResponse.statusCode === 202;
    };
}
