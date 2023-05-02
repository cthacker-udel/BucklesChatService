export type HunterValidationResult = {
    data: {
        status: string;
        result: string;
        _deprecation_notice: string;
        score: number;
        email: string;
        regexp: boolean;
        gibberish: boolean;
        disposable: boolean;
        webmail: boolean;
        mx_records: boolean;
        smtp_server: boolean;
        smtp_check: boolean;
        accept_all: boolean;
        block: boolean;
        sources: {
            domain: string;
            uri: string;
            extracted_on: string;
            last_seen_on: string;
            still_on_page: string;
        }[];
    };
    meta: {
        params: {
            email: string;
        };
    };
};
