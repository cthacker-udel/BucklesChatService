import { Client } from "pg";

class PSqlService {
    client: Client;

    public constructor() {
        /**
         * Initializing the psql client
         */
        this.client = new Client({
            database: process.env.PSQL_DATABASE,
            host: process.env.PSQL_HOST,
            password: process.env.PSQL_PASSWORD,
            port: Number(process.env.PSQL_PORT) ?? 5432,
            user: process.env.PSQL_USER,
        });

        /**
         * Initialize connection to PSQL database
         */
        this.init()
            .then(() => {
                console.log("Connected to PSQL database successfully!");
            })
            .catch((err: unknown) => {
                console.error(
                    "Failed to connect to PSQL database",
                    (err as Error).message,
                );
            });
    }

    public async init() {
        /**
         * Starting the connection to the database
         */
        await this.client.connect();
    }
}
