/* eslint-disable implicit-arrow-linebreak -- disabled */
import { Request } from "express";

/**
 * Parses and fetches the id from the provided request which is coming from the client
 * The id is used for tracking transactions and knowing exactly where a call is coming from and what other
 * processes were involved in the calling of this controller method.
 *
 * **The id is required to be provided via query string**
 *
 * @example
 * const request: Request = some_request_in_parameter_or_generated; // (url is https://example.com?id=randomguid)
 * const parsedId = getIdFromRequest(request);
 * console.log(parsedId); // randomguid
 *
 * @param request - The express request to parse for the id
 * @returns The id parsed from the request
 */
export const getIdFromRequest = (request: Request): string =>
    request.query.id as string;
