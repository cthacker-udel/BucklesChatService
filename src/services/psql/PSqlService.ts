import { Client } from "pg";
import { Sequelize, DataTypes, ModelStatic } from "sequelize";
import { SqlizeUser } from "../../models/sequelize/SqlizeUser";
import { SqlizeBlock } from "../../models/sequelize/SqlizeBlocks";
import { SqlizeFriendRequest } from "../../models/sequelize/SqlizeFriendRequest";
import { SqlizeFriend } from "../../models/sequelize/SqlizeFriend";

export class PSqlService {
    public client: Client;
    public sqlize: Sequelize;
    public userModel: ModelStatic<SqlizeUser> | undefined;
    public blockModel: ModelStatic<SqlizeBlock> | undefined;
    public friendRequestModel: ModelStatic<SqlizeFriendRequest> | undefined;
    public friendModel: ModelStatic<SqlizeFriend> | undefined;

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

        this.sqlize = new Sequelize(
            `postgres://${process.env.PSQL_USER}:${process.env.PSQL_PASSWORD}@${process.env.PSQL_HOST}:${process.env.PSQL_PORT}/${process.env.PSQL_DATABASE}`,
        );

        this.sqlize
            .authenticate()
            .then(() => {
                console.log("SQLize connected to PSQL db successfully!");
                this.defineModels();
            })
            .catch((err: unknown) => {
                console.error(
                    "SQLize failed to connect to PSQL database",
                    (err as Error).message,
                );
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

    public defineModels() {
        this.userModel = this.sqlize.define<SqlizeUser>("bucklesuser", {
            createdAt: {
                allowNull: true,
                field: "created_at",
                type: DataTypes.DATE,
            },
            dob: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            email: {
                allowNull: true,
                type: DataTypes.STRING({ length: 120 }),
            },
            firstName: {
                allowNull: true,
                field: "first_name",
                type: DataTypes.STRING({ length: 70 }),
            },
            handle: {
                allowNull: true,
                type: DataTypes.STRING({ length: 12 }),
            },
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            lastName: {
                allowNull: true,
                field: "last_name",
                type: DataTypes.STRING({ length: 70 }),
            },
            password: {
                allowNull: false,
                type: DataTypes.STRING({ length: 128 }),
            },
            passwordSalt: {
                allowNull: false,
                field: "password_salt",
                type: DataTypes.STRING({ length: 128 }),
            },
            profileImageRemovalUrl: {
                allowNull: true,
                field: "profile_image_removal_url",
                type: DataTypes.STRING({ length: 128 }),
            },
            profileImageUrl: {
                allowNull: true,
                field: "profile_image_url",
                type: DataTypes.STRING({ length: 128 }),
            },
            updatedAt: {
                allowNull: true,
                field: "updated_at",
                type: DataTypes.DATE,
            },
            username: {
                allowNull: false,
                type: DataTypes.STRING({ length: 70 }),
                unique: true,
            },
        });

        this.friendModel = this.sqlize.define("bucklesfriend", {
            accepted: {
                allowNull: true,
                type: DataTypes.BIGINT,
            },
            createdAt: {
                allowNull: true,
                field: "created_at",
                type: DataTypes.DATE,
            },
            recipient: {
                allowNull: true,
                type: DataTypes.STRING({ length: 128 }),
            },
            sender: {
                allowNull: true,
                type: DataTypes.STRING({ length: 128 }),
            },
            updatedAt: {
                allowNull: true,
                field: "updated_at",
                type: DataTypes.DATE,
            },
        });

        this.friendRequestModel = this.sqlize.define("bucklesfriendrequest", {
            createdAt: {
                allowNull: true,
                field: "created_at",
                type: DataTypes.DATE,
            },
            customMessage: {
                allowNull: true,
                field: "custom_message",
                type: DataTypes.STRING({ length: 128 }),
            },
            sender: {
                allowNull: true,
                type: DataTypes.STRING({ length: 70 }),
            },
            sent: {
                allowNull: true,
                type: DataTypes.BIGINT,
            },
            updatedAt: {
                allowNull: true,
                field: "updated_at",
                type: DataTypes.DATE,
            },
            username: {
                allowNull: true,
                type: DataTypes.STRING({ length: 70 }),
            },
        });

        this.blockModel = this.sqlize.define("bucklesblock", {
            blocked: {
                allowNull: true,
                type: DataTypes.BIGINT,
            },
            createdAt: {
                allowNull: true,
                field: "created_at",
                type: DataTypes.DATE,
            },
            reason: {
                allowNull: true,
                type: DataTypes.STRING({ length: 128 }),
            },
            sender: {
                allowNull: true,
                type: DataTypes.STRING({ length: 70 }),
            },
            updatedAt: {
                allowNull: true,
                field: "updated_at",
                type: DataTypes.DATE,
            },
            username: {
                allowNull: true,
                type: DataTypes.STRING({ length: 128 }),
            },
        });
    }
}
