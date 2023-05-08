import { NextFunction, Request, Response } from "express";

/**
 * Authenticates a request, verifying that the user requesting the resource is an administrator, it will look for a specific header in the request, with a specific hash value
 *
 * @param request - The client request
 * @param response - The client response
 * @param nextFunction - The next function in the middleware chain
 */
export const adminVerification = (
    request: Request,
    response: Response,
    nextFunction: NextFunction,
): void => {
    try {
        const headerValue = request.header(process.env.ADMIN_HEADER as string);
        if (headerValue === process.env.ADMIN_HEADER_PASSWORD) {
            nextFunction();
        } else {
            throw new Error("Request does not have proper privileges");
        }
    } catch (error: unknown) {
        response.status(401).json({ message: (error as Error).message });
    }
};
