import { Router } from "express";
import { BucklesRoutes } from "src/@types/routes/BucklesRoutes";
import { BucklesRouter } from "src/app/BucklesRouter";
import { IBaseController } from "./IBaseControllers";

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
     * Zero-arg Two-optional constructor, takes in two arguments, one for PSQL mapping, and the second for API mapping.
     *
     * @param _tableName - (optional) The name of the PSQL table this controller maps to
     * @param _prefix - (optional) The api route prefix this controller acts under
     */
    public constructor(_tableName?: string, _prefix?: string) {
        this.table = _tableName ?? "";
        this.prefix = _prefix ?? "";
    }

    /** @inheritdoc */
    public generateRouter = (_routes: BucklesRoutes): BucklesRouter => {
        const createdRouter = new BucklesRouter(Router(), this.prefix);
        createdRouter.processRoutes(_routes);
        return createdRouter;
    };
}
