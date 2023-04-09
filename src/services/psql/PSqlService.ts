import { User } from "../../models/sequelize/User";
import { Block } from "../../models/sequelize/Block";
import { FriendRequest } from "../../models/sequelize/FriendRequest";
import { Friend } from "../../models/sequelize/Friend";
import { Sequelize, Repository } from "sequelize-typescript";

export class PSqlService {
    public sqlize: Sequelize;
    public connected: boolean;
    public userRepo: Repository<User>;
    public blockRepo: Repository<Block>;
    public friendRequestRepo: Repository<FriendRequest>;
    public friendRepo: Repository<Friend>;

    public constructor() {
        this.sqlize = new Sequelize(
            `postgres://${process.env.PSQL_USER}:${process.env.PSQL_PASSWORD}@${process.env.PSQL_HOST}:${process.env.PSQL_PORT}/${process.env.PSQL_DATABASE}`,
            { repositoryMode: true },
        );

        this.sqlize
            .authenticate()
            .then(() => {
                console.log("SQLize connected to PSQL db successfully!");
                this.connected = true;
            })
            .catch((err: unknown) => {
                console.error(
                    "SQLize failed to connect to PSQL database",
                    (err as Error).message,
                );
                this.connected = false;
            });

        this.sqlize.addModels([Block, Friend, FriendRequest, User]);
        this.userRepo = this.sqlize.getRepository(User);
        this.blockRepo = this.sqlize.getRepository(Block);
        this.friendRequestRepo = this.sqlize.getRepository(FriendRequest);
        this.friendRepo = this.sqlize.getRepository(Friend);
    }
}
