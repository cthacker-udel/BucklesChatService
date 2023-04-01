import { ApiErrorCodes } from "@/constants/enums/ApiErrorCodes";

export type ApiErrorInfo = {
    id: string;
    message?: string;
    stack?: string;
    code?: ApiErrorCodes;
};
