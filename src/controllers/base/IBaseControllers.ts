import { BucklesRoute } from "src/@types/routes/BucklesRoute";
import { BucklesRoutes } from "src/@types/routes/BucklesRoutes";
import { BucklesRouter } from "src/app/BucklesRouter";
import { BucklesRouteType } from "src/constants/enums/BucklesRouteType";

export interface IBaseController {
    /**
     * Creates a new router instance provided the routes to instantiate it with
     *
     * @param _routes - The routes to instantiate the router with
     * @throws If the internal routes member is undefined, the service cannot instantiate the expressJS router.
     * @returns The created router instance
     */
    generateRouter: (_routes: BucklesRoutes) => BucklesRouter;

    /**
     * Adds all routes specified by `_routes` to the API method specified by `_type` to the route instance calling this function
     *
     * @param _routes - The routes we are adding to the method specified by `_type`
     * @param _type - The type of method we are utilizing with the routes specified by `_routes`
     * @returns The modified instance
     */
    addRoutes: (
        _routes: BucklesRoute[],
        _type: BucklesRouteType,
    ) => IBaseController;
}
