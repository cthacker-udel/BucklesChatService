import express from "express";
import core from "express-serve-static-core";
import { IBucklesApplication } from "./IBucklesApplication";
import { MongoService } from "../services/mongo/MongoService";
import { LoggerController } from "../controllers/logger/LoggerController";

export class BucklesApplication implements IBucklesApplication {
    /**
     * The application instance, which houses and handles all CRUD requests
     */
    public app: core.Express;

    /**
     *  No-arg constructor that initializes the local backend instance to a new express
     */
    public constructor() {
        this.app = express();
    }

    /** @inheritdoc */
    public start(): void {
        this.app.listen(process.env.PORT, () => {
            console.log(`Listening on port ${process.env.PORT}`);
        });
        const mongoService = new MongoService();

        const loggerController = new LoggerController(mongoService);
        this.app.use(loggerController.generateRouter());
    }
}
