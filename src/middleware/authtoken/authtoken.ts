import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { SessionToken } from "../../@types/encryption/SessionToken";

/**
 * Authenticates a user supplied json web token, verifying that the user matches
 *
 * @param request - The client request
 * @param response - The client response
 * @param nextFunction - The next function in the middleware chain
 */
export const authToken = (
    request: Request,
    response: Response,
    nextFunction: NextFunction,
): void => {
    try {
        if (request.url.includes("login") && request.method.includes("POST")) {
            nextFunction();
        } else {
            const token = request.cookies["X-USERNAME"] as string;

            const decodedToken = verify(
                token,
                process.env.TOKEN_SECRET as string,
            ) as Partial<SessionToken>;

            if (decodedToken.username === undefined) {
                response.clearCookie("X-USERNAME");
                throw new Error("Invalid token supplied");
            }
            nextFunction();
        }
    } catch (error: unknown) {
        response.status(401).json({ message: (error as Error).message });
    }
};
