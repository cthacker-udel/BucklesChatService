import { Request, Response, Router } from "express";
import { BucklesRoutes } from "../../@types/routes/BucklesRoutes";
import { BucklesRoute } from "../../@types/routes/BucklesRoute";
import { BucklesRouteType } from "../../constants/enums/BucklesRouteType";

export interface IBaseController {
    /**
     * Creates a new router instance provided the routes to instantiate it with
     *
     * @throws If the internal routes member is undefined, the service cannot instantiate the expressJS router.
     * @returns The created router instance
     */
    generateRouter: (_routes: BucklesRoutes) => Router;

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

    /**
     * Common status check for all controllers utilizing this base class
     *
     * @param _request - The client request
     * @param _response - The client response
     * @returns Whether or not the service is up
     */
    statusCheck: (_request: Request, _response: Response) => void;
}
