import { ApiErrorInfo } from "../errorInfo/ApiErrorInfo";

/**
 * Default api response, which allows for a common structure to the responses the api provides to the frontend
 */
export class ApiResponse<T> {
    /**
     * The id of the response, allows for tracing
     */
    public id?: string;
    /**
     * The data of the response
     */
    public data?: T;
    /**
     * The error in the response if any
     */
    public apiError?: ApiErrorInfo;

    /**
     * 1-arg 2-optional constructor instantiating an instance of an Api response, which houses the fundamental
     * structure of the way the api communicates with the front-end
     *
     * @param _id - The id of the transaction, used for tracing purposes
     * @param _data - The data being appended with the response
     * @param _apiError - The error being appended with the response
     */
    public constructor(_id: string, _data?: T, _apiError?: ApiErrorInfo) {
        this.id = _id;
        this.data = _data;
        this.apiError = _apiError;
    }

    /**
     * Sets the data of the api response and returns the modified instance
     *
     * @param _data - The data to set
     * @returns The modified instance of the class
     */
    public setData = (_data: T): ApiResponse<T> => {
        this.data = _data;
        return this;
    };

    /**
     * Sets the error of the api response and returns the modified instance
     *
     * @param _error - The api error to append to the ApiResponse instance
     * @returns The modified instance of the class
     */
    public setApiError = (_error: ApiErrorInfo): ApiResponse<T> => {
        this.apiError = _error;
        return this;
    };
}
