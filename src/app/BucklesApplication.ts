import express from "express";
import core from "express-serve-static-core";
import { IBucklesApplication } from "./IBucklesApplication";
import { MongoService } from "../services/mongo/MongoService";
import { LoggerController } from "../controllers/logger/LoggerController";
import { UserController } from "../controllers/user/UserController";
import morgan from "morgan";
import { PSqlService } from "../services/psql/PSqlService";
import { RedisService } from "../services/redis/RedisService";
import { FriendController } from "../controllers/friend/FriendController";
import { MessageController } from "../controllers/message/MessageController";
import session from "express-session";
import { EncryptionService } from "../services/encryption/EncryptionService";
import cookieParser from "cookie-parser";

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
        const psqlService = new PSqlService();
        const redisService = new RedisService();
        const encryptionService = new EncryptionService();

        const loggerController = new LoggerController(mongoService);
        const userController = new UserController(
            mongoService,
            psqlService,
            redisService,
            encryptionService,
        );
        const friendController = new FriendController(
            mongoService,
            psqlService,
            redisService,
            encryptionService,
        );

        const messageController = new MessageController(
            mongoService,
            psqlService,
            encryptionService,
        );

        this.app.use(morgan("dev"));
        this.app.use(cookieParser());
        this.app.use(express.json());
        this.app.use(
            session({
                resave: true,
                saveUninitialized: true,
                secret: process.env.COOKIE_SECRET ?? "",
            }),
        );
        this.app.use(loggerController.generateRouter());
        this.app.use(userController.generateRouter());
        this.app.use(friendController.generateRouter());
        this.app.use(messageController.generateRouter());
        this.app.listen(process.env.PORT, () => {
            console.log(`Listening on port ${process.env.PORT}`);
        });
    }
}
