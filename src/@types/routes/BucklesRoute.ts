import { RequestHandler } from "express";

export type BucklesRoute = {
    endpoint: string;
    handler: RequestHandler;
    middleware?: RequestHandler[];
};
