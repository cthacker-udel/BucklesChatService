/* eslint-disable implicit-arrow-linebreak -- disabled */
import { Request } from "express";

export const getIdFromRequest = (request: Request): string =>
    request.query.id as string;
