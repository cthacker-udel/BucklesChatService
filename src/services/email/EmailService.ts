import { Client } from "@sendgrid/client";
import { IEmailService } from "./IEmailService";
import { SendgridEmailValidationResult } from "../../@types/user/SendgridEmailValidationResult";
import { MailboxValidationResult } from "../../@types/user/MailboxLayerValidationResult";
import { AbstractValidationResult } from "../../@types/user/AbstractValidationResult";

export class EmailService implements IEmailService {
    /**
     * The sendgrid client which is used to make requests
     */
    private readonly client: Client;

    /**
     * One-arg constructor that takes in an instance of the sendgrid client to instantiate it's private field with that instance
     *
     * @param _client - The client passed in from the base application to populate the inner client which is used to make requests to the API
     */
    public constructor() {
        this.client = new Client();
        this.client.setApiKey(process.env.SENDGRID_API_KEY as string);
    }

    /** @inheritdoc */
    public isEmailValid = async (email: string): Promise<boolean> => {
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
            try {
                const mailboxLayerResponse = await fetch(
                    `https://api.apilayer.com/email_verification/check?email=${email}`,
                    {
                        headers: {
                            apikey: process.env.MAILBOX_LAYER_API_KEY as string,
                        },
                        method: "GET",
                        redirect: "follow",
                    },
                );
                const mailboxResponseJSON = await mailboxLayerResponse.json();
                return (
                    (mailboxResponseJSON as MailboxValidationResult).score > 0
                );
            } catch {
                const abstractResponse = await fetch(
                    `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`,
                );
                const abstractResponseJSON = await abstractResponse.json();
                return (
                    (abstractResponseJSON as AbstractValidationResult)
                        .deliverability === "DELIVERABLE"
                );
            }
        }
    };
}
