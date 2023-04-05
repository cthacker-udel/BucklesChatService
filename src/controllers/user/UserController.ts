/* eslint-disable @typescript-eslint/no-misused-promises -- disabled */
import { IUserController } from "./IUserController";

import { BaseController } from "../base/BaseController";
import { PSqlService } from "../../services/psql/PSqlService";
import { MongoService } from "../../services/mongo/MongoService";
import { Request, Response } from "express";
import { getIdFromRequest } from "../../helpers/api/getIdFromRequest";
import { UserService } from "../../services/user/UserService";
import { LoggerService } from "../../services/logger/LoggerService";
import { exceptionToExceptionLog } from "../../helpers/logger/exceptionToExceptionLog";
import { BucklesRouteType } from "../../constants/enums/BucklesRouteType";

export class UserController extends BaseController implements IUserController {
    /**
     * The internal psqlClient instance allowing for querying of the database
     */
    private readonly psqlClient: PSqlService;

    /**
     * Logger controller used for logging exceptions to the mongo database
     */
    private readonly loggerService: LoggerService;

    /**
     * Service used for calling logger controller methods
     */
    private readonly mongoService: MongoService;

    /**
     * Service used to handle all user operations in the database
     */
    private readonly userService: UserService;

    /**
     * No-arg constructor, whose purpose is to initialize the psql instance
     */
    public constructor(_mongoService: MongoService) {
        super(process.env.USER_TABLE, "user");
        this.loggerService = new LoggerService(_mongoService);
        this.mongoService = _mongoService;
        this.psqlClient = new PSqlService();
        super.addRoutes(
            [
                {
                    endpoint: "doesUsernameExist",
                    handler: this.doesUsernameExist,
                },
            ],
            BucklesRouteType.GET,
        );
        super.setStatusFunction(() => {
            if (this.psqlClient.client.database === undefined) {
                throw new Error("PSQL Client is not connected");
            }
            if (this.mongoService === undefined) {
                throw new Error("Mongo Client is not connected");
            }
            if (this.loggerService === undefined) {
                throw new Error("Logger Controller is not connected");
            }
        });
        this.userService = new UserService(this.psqlClient, this.loggerService);
    }

    /** @inheritdoc */
    public doesUsernameExist = async (
        request: Request,
        response: Response,
    ): Promise<void> => {
        let id = "";
        try {
            id = getIdFromRequest(request);
            const username = request.query.username as string;
            const usernameResponse = await this.userService.doesUsernameExist(
                id,
                username,
            );
            response.status((usernameResponse.data as boolean) ? 400 : 200);
            response.send(usernameResponse);
        } catch (error: unknown) {
            await this.loggerService.LogException(
                id,
                exceptionToExceptionLog(error, id),
            );
        }
    };
}
