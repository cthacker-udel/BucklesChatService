import { Request, Response, Router } from "express";

import { IBaseController } from "./IBaseControllers";
import { BucklesRoutes } from "../../@types/routes/BucklesRoutes";
import { BucklesRouteType } from "../../constants/enums/BucklesRouteType";
import { BucklesRouter } from "../../app/BucklesRouter";
import { BucklesRoute } from "../../@types/routes/BucklesRoute";
import { toBucklesRoute } from "../../helpers/routes/toBucklesRoute";

/**
 * The base class for all controllers, their minimum requirements to function properly
 */
export class BaseController implements IBaseController {
    /**
     * The name of the PSQL table this controller belongs to
     */
    public table: string;

    /**
     * The prefix this controller acts under
     */
    public prefix: string;

    /**
     * The routes this controller uses in the api
     */
    public routes: BucklesRoutes;

    /**
     * The function to determine if systems are online
     */
    public statusFunction: () => void;

    /**
     * _K operates on a set of singleton types (enum) and produces a new type of each singleton as a property name
     * This allows for me to take the enum and map each of it's values into a property name for the object, which then allows
     * me to complete the mapping.
     */
    private readonly routeTypeKeyMapping: { [_K in BucklesRouteType]: string } =
        {
            "0": "get",
            "1": "post",
            "2": "put",
            "3": "delete",
            "4": "options",
            "5": "patch",
        };

    /**
     * Zero-arg Two-optional constructor, takes in two arguments, one for PSQL mapping, and the second for API mapping.
     *
     * @param _tableName - (optional) The name of the PSQL table this controller maps to
     * @param _prefix - (optional) The api route prefix this controller acts under
     */
    public constructor(
        _tableName?: string,
        _prefix?: string,
        _statusFunction?: () => void,
    ) {
        this.table = _tableName ?? "";
        this.prefix = _prefix ?? "";
        this.routes = { get: [toBucklesRoute("status", this.statusCheck)] };
        this.statusFunction = _statusFunction ?? (() => {});
    }

    /** @inheritdoc */
    public setStatusFunction(_statusFunction: () => void): IBaseController {
        this.statusFunction = _statusFunction;
        return this;
    }

    /** @inheritdoc */
    public statusCheck = (_request: Request, response: Response): void => {
        try {
            this.statusFunction();
            response.status(200);
            response.send({ status: "online" });
        } catch (error: unknown) {
            response.status(500);
            response.send({ status: (error as Error).message });
        }
    };

    /** @inheritdoc */
    public generateRouter(): Router {
        if (Object.keys(this.routes).length === 0) {
            throw new Error("Cannot instantiate router if routes is empty");
        }
        const createdRouter = new BucklesRouter(Router(), this.prefix);
        createdRouter.processRoutes(this.routes);
        return createdRouter.router;
    }

    /** @inheritdoc */
    public addRoutes(_routes: BucklesRoute[], _type: BucklesRouteType) {
        this.routes[this.routeTypeKeyMapping[_type]] =
            this.routes[this.routeTypeKeyMapping[_type]] === undefined
                ? _routes
                : [...this.routes[this.routeTypeKeyMapping[_type]], ..._routes];
        return this;
    }
}
