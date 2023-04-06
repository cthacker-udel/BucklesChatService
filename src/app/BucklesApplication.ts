import express from "express";
import core from "express-serve-static-core";
import { IBucklesApplication } from "./IBucklesApplication";
import { MongoService } from "../services/mongo/MongoService";
import { LoggerController } from "../controllers/logger/LoggerController";
import { UserController } from "../controllers/user/UserController";

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
        const mongoService = new MongoService();

        const loggerController = new LoggerController(mongoService);
        const userController = new UserController(mongoService);

        this.app.use(express.json());
        this.app.use(loggerController.generateRouter());
        this.app.use(userController.generateRouter());
        this.app.listen(process.env.PORT, () => {
            console.log(`Listening on port ${process.env.PORT}`);
        });
    }
}
