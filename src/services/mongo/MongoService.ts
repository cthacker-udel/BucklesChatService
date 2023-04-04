import { MongoClient, Collection, Db } from "mongodb";

/**
 * Instance of the MongoService, which houses all the logic of accessing the mongo database
 */
export class MongoService {
    /**
     * The mongo client instance
     */
    client?: MongoClient = undefined;

    /**
     * Adds the new mongo client that is connected to the database
     */
    public constructor() {
        this.client = new MongoClient(process.env.MONGO_URI ?? "");
    }

    /**
     * Checks if the client is instantiated, and if it is not, then throws an error
     */
    public checkClient() {
        if (this.client === undefined) {
            throw new Error(
                "Cannot execute client command when client is undefined",
            );
        }
    }

    /**
     * Initializes the connection the mongo client has to the database
     */
    public async init() {
        this.checkClient();
        await this.client!.connect();
    }

    /**
     * Access a database in the mongo server given the specific database name
     *
     * @param dbName - The name of the database we are accessing
     * @returns - The found database
     */
    public db(dbName: string): Db {
        this.checkClient();
        return this.client!.db(dbName);
    }

    /**
     * Access a collection from the mongo database
     *
     * @param db - The database we are accessing the collection from
     * @param collectionName - The name of the collection we are accessing
     * @returns - The accessed collection
     */
    public collection(db: Db, collectionName: string): Collection {
        this.checkClient();
        return db.collection(collectionName);
    }
}
