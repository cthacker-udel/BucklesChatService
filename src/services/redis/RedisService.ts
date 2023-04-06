import { createClient } from "redis";
import { IRedisService } from "./IRedisService";
import { RedisClientType } from "@redis/client";

export class RedisService implements IRedisService {
    public readonly client: RedisClientType;

    /**
     * No-arg constructor that uses environment variables to connect to the redis database
     */
    public constructor() {
        this.client = createClient({
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_ENDPOINT,
                port: Number(process.env.REDIS_PORT) ?? 0,
            },
        });

        this.init()
            .then((_) => {
                console.log("Connected to redis database!");
            })
            .catch((error: unknown) => {
                console.error(
                    `Failed to connect to Redis database! ${
                        (error as Error).message
                    }`,
                );
            });
    }

    /** @inheritdoc */
    public async init() {
        await this.client.connect();
    }
}
