import { BucklesRoutes } from "../@types/routes/BucklesRoutes";

export interface IBucklesRouter {
    /**
     * Processes all API routes for a specific endpoint
     *
     * @param _routes - The routes to process, populates all API methods
     * @returns Nothing, as it mutates the local expressJS instance
     */
    processRoutes: (_routes: BucklesRoutes) => void;
}
