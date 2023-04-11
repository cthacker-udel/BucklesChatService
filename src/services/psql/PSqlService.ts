/* eslint-disable max-lines-per-function -- disabled */
import { User } from "../../models/sequelize/User";
import { Block } from "../../models/sequelize/Block";
import { FriendRequest } from "../../models/sequelize/FriendRequest";
import { Friend } from "../../models/sequelize/Friend";
import { Sequelize, ModelStatic, DataTypes } from "@sequelize/core";

export class PSqlService {
    public sqlize: Sequelize;
    public connected: boolean;
    public userRepo: ModelStatic<User>;
    public blockRepo: ModelStatic<Block>;
    public friendRequestRepo: ModelStatic<FriendRequest>;
    public friendRepo: ModelStatic<Friend>;

    public constructor() {
        this.sqlize = new Sequelize(
            `postgres://${process.env.PSQL_USER}:${process.env.PSQL_PASSWORD}@${process.env.PSQL_HOST}:${process.env.PSQL_PORT}/${process.env.PSQL_DATABASE}`,
            {
                logging: false,
            },
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
        this.defineModels();
    }

    public defineModels() {
        this.userRepo = User.init(
            {
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                dob: {
                    allowNull: true,
                    type: DataTypes.INTEGER,
                    validate: {
                        isInt: true,
                        isNumeric: true,
                    },
                },
                email: {
                    allowNull: true,
                    type: DataTypes.STRING(120),
                    validate: {
                        isEmail: true,
                    },
                },
                firstName: {
                    allowNull: true,
                    type: DataTypes.STRING(70),
                    validate: {
                        isAlphanumeric: true,
                    },
                },
                handle: {
                    allowNull: true,
                    type: DataTypes.STRING(12),
                    validate: {
                        isAlphanumeric: true,
                    },
                },
                lastName: {
                    allowNull: true,
                    type: DataTypes.STRING(70),
                    validate: {
                        isAlpha: true,
                    },
                },
                password: {
                    allowNull: false,
                    type: DataTypes.STRING(128),
                    validate: {
                        notNull: true,
                    },
                },
                passwordSalt: {
                    allowNull: false,
                    type: DataTypes.STRING(128),
                    validate: {
                        notNull: true,
                    },
                },
                profileImageRemovalUrl: {
                    allowNull: true,
                    type: DataTypes.STRING(128),
                    validate: {
                        isUrl: true,
                    },
                },
                profileImageUrl: {
                    allowNull: true,
                    type: DataTypes.STRING(128),
                    validate: {
                        isUrl: true,
                    },
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                username: {
                    allowNull: false,
                    type: DataTypes.STRING(70),
                    unique: true,
                },
            },
            {
                sequelize: this.sqlize,
                tableName: "bucklesusers",
                timestamps: true,
                underscored: true,
            },
        );
        this.blockRepo = Block.init(
            {
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                reason: {
                    allowNull: true,
                    type: DataTypes.STRING(128),
                },
                sender: {
                    allowNull: false,
                    references: {
                        key: "username",
                        model: User,
                    },
                    type: DataTypes.STRING(70),
                    validate: {
                        isAlpha: true,
                    },
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                username: {
                    allowNull: false,
                    references: {
                        key: "username",
                        model: User,
                    },
                    type: DataTypes.STRING(70),
                    validate: {
                        isAlpha: true,
                    },
                },
            },
            {
                sequelize: this.sqlize,
                tableName: "bucklesblocks",
                timestamps: true,
            },
        );
        this.friendRepo = Friend.init(
            {
                accepted: {
                    allowNull: true,
                    type: DataTypes.BIGINT,
                    validate: {
                        isInt: true,
                        isNumeric: true,
                    },
                },
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                recipient: {
                    allowNull: false,
                    references: {
                        key: "username",
                        model: User,
                    },
                    type: DataTypes.STRING(70),
                    validate: {
                        isAlpha: true,
                    },
                },
                sender: {
                    allowNull: false,
                    references: {
                        key: "username",
                        model: User,
                    },
                    type: DataTypes.STRING(70),
                    validate: {
                        isAlpha: true,
                    },
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
            },
            {
                sequelize: this.sqlize,
                tableName: "bucklesfriends",
                timestamps: true,
            },
        );
        this.friendRequestRepo = FriendRequest.init(
            {
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                customMessage: {
                    allowNull: true,
                    type: DataTypes.STRING(128),
                },
                sender: {
                    allowNull: false,
                    references: {
                        key: "username",
                        model: User,
                    },
                    type: DataTypes.STRING(70),
                    validate: {
                        isAlpha: true,
                    },
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                username: {
                    allowNull: false,
                    references: {
                        key: "username",
                        model: User,
                    },
                    type: DataTypes.STRING(70),
                    validate: {
                        isAlpha: true,
                    },
                },
            },
            {
                sequelize: this.sqlize,
                tableName: "bucklesfriendrequests",
                timestamps: true,
                underscored: true,
            },
        );
    }
}
