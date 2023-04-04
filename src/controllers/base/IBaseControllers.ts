import { BucklesRoutes } from "src/@types/routes/BucklesRoutes";
import { BucklesRouter } from "src/app/BucklesRouter";

export interface IBaseController {
    /**
     * Creates a new router instance provided the routes to instantiate it with
     *
     * @param _routes - The routes to instantiate the router with
     * @returns The created router instance
     */
    generateRouter: (_routes: BucklesRoutes) => BucklesRouter;
}
