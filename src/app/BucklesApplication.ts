import express from "express";
import core from "express-serve-static-core";

export class BucklesApplication {
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

    /**
     * Starts the application, app begins listening on the environment port
     */
    public start(): void {
        this.app.listen(process.env.PORT, () => {
            console.log(`Listening on port ${process.env.PORT}`);
        });
    }
}
