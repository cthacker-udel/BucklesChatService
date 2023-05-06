import { BucklesRoute } from "./BucklesRoute";

export type BucklesRoutes = {
    get?: BucklesRoute[];
    post?: BucklesRoute[];
    put?: BucklesRoute[];
    delete?: BucklesRoute[];
    options?: BucklesRoute[];
    patch?: BucklesRoute[];
} & { [key: string]: BucklesRoute[] };
