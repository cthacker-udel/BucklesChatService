import { ApiErrorInfo } from "../errorInfo/ApiErrorInfo";

export type ApiResponse = {
    id?: string;
    data?: any;
    apiError?: ApiErrorInfo;
};
