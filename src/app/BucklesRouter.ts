import { Router } from "express";
import { IBucklesRouter } from "./IBucklesRouter";
import { BucklesRoutes } from "../@types/routes/BucklesRoutes";
import { BucklesRoute } from "../@types/routes/BucklesRoute";

/**
 * Wrapper over expressJs router
 */
export class BucklesRouter implements IBucklesRouter {
    /**
     * The express router instance
     */
    public readonly router: Router;

    /**
     * The prefix designating the service the routes are under
     */
    public readonly prefix: string;

    /**
     * One-arg constructor, takes in an expressJs router instance to map to it's local member
     *
     * @param _router - The router instance to set to the public readonly member `router`
     * @param _prefix - The prefix for the endpoints, to stipulate which service the endpoints fall under
     */
    public constructor(_router: Router, _prefix: string) {
        this.router = _router;
        this.prefix = _prefix;
    }

    /** @inheritdoc */
    public processRoutes = (_routes: BucklesRoutes): void => {
        Object.keys(_routes).forEach((eachMethod) => {
            const foundRoutes = _routes[eachMethod];
            foundRoutes.forEach((eachRoute: BucklesRoute) => {
                switch (eachMethod) {
                    case "get": {
                        this.router.get(
                            `/${this.prefix}/${eachRoute.endpoint}`,
                            eachRoute.handler,
                            [...(eachRoute.middleware ?? [])],
                        );
                        break;
                    }
                    case "put": {
                        this.router.put(
                            `/${this.prefix}/${eachRoute.endpoint}`,
                            eachRoute.handler,
                            [...(eachRoute.middleware ?? [])],
                        );
                        break;
                    }
                    case "post": {
                        this.router.post(
                            `/${this.prefix}/${eachRoute.endpoint}`,
                            eachRoute.handler,
                            [...(eachRoute.middleware ?? [])],
                        );
                        break;
                    }
                    case "delete": {
                        this.router.delete(
                            `/${this.prefix}/${eachRoute.endpoint}`,
                            eachRoute.handler,
                            [...(eachRoute.middleware ?? [])],
                        );
                        break;
                    }
                    case "options": {
                        this.router.options(
                            `/${this.prefix}/${eachRoute.endpoint}`,
                            eachRoute.handler,
                            [...(eachRoute.middleware ?? [])],
                        );
                        break;
                    }
                    default: {
                        break;
                    }
                }
            });
        });
    };
}
