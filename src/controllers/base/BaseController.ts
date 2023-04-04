import { Router } from "express";
import { BucklesRoutes } from "src/@types/routes/BucklesRoutes";
import { BucklesRouter } from "src/app/BucklesRouter";
import { IBaseController } from "./IBaseControllers";
import { BucklesRoute } from "src/@types/routes/BucklesRoute";
import { BucklesRouteType } from "src/constants/enums/BucklesRouteType";

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
        };

    /**
     * Zero-arg Two-optional constructor, takes in two arguments, one for PSQL mapping, and the second for API mapping.
     *
     * @param _tableName - (optional) The name of the PSQL table this controller maps to
     * @param _prefix - (optional) The api route prefix this controller acts under
     */
    public constructor(_tableName?: string, _prefix?: string) {
        this.table = _tableName ?? "";
        this.prefix = _prefix ?? "";
        this.routes = {};
    }

    /** @inheritdoc */
    public generateRouter = (): BucklesRouter => {
        if (Object.keys(this.routes).length === 0) {
            throw new Error("Cannot instantiate router if routes is empty");
        }

        const createdRouter = new BucklesRouter(Router(), this.prefix);
        createdRouter.processRoutes(this.routes);
        return createdRouter;
    };

    /** @inheritdoc */
    public addRoutes = (_routes: BucklesRoute[], _type: BucklesRouteType) => {
        this.routes[this.routeTypeKeyMapping[_type]] = _routes;
        return this;
    };
}
