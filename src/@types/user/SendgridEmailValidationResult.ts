export type SendgridEmailValidationResult = {
    result: {
        email: string;
        verdict: string;
        score: number;
        local: string;
        host: string;
        suggestion: string;
        checks: {
            domain: {
                has_valid_address_syntax: boolean;
                has_mx_or_a_record: boolean;
                is_suspected_disposable_address: boolean;
            };
            local_part: {
                is_suspected_role_address: boolean;
            };
            additional: {
                has_known_bounces: boolean;
                has_suspected_bounces: boolean;
            };
        };
        source: string;
        ip_address: string;
    };
};
