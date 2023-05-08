/* eslint-disable implicit-arrow-linebreak -- disabled */
import { Request } from "express";

export const convertRequestToThrottleKey = (request: Request): string =>
    `${request.ip}`;
