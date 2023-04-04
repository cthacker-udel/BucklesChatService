import { RequestHandler } from "express";
import { BucklesRoute } from "../../@types/routes/BucklesRoute";

export const toBucklesRoute = (
    endpoint: string,
    handler: RequestHandler,
    middleware?: RequestHandler[],
): BucklesRoute => ({ endpoint, handler, middleware });
