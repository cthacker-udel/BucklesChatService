/* eslint-disable max-lines-per-function -- disabled */
import { User } from "../../models/sequelize/User";
import { Block } from "../../models/sequelize/Block";
import { FriendRequest } from "../../models/sequelize/FriendRequest";
import { Friend } from "../../models/sequelize/Friend";
import { Sequelize, ModelStatic, DataTypes } from "@sequelize/core";
import { ChatRoom } from "../../models/sequelize/ChatRoom";
import { Message } from "../../models/sequelize/Message";
import { Thread } from "../../models/sequelize/Thread";
import { ActiveStatusType } from "../../@types/user/ActiveStatus";

export class PSqlService {
    public sqlize: Sequelize;
    public connected: boolean;
    public userRepo: ModelStatic<User>;
    public blockRepo: ModelStatic<Block>;
    public friendRequestRepo: ModelStatic<FriendRequest>;
    public friendRepo: ModelStatic<Friend>;
    public chatRoomRepo: ModelStatic<ChatRoom>;
    public messageRepo: ModelStatic<Message>;
    public threadRepo: ModelStatic<Thread>;

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
                emailConfirmationToken: {
                    allowNull: true,
                    defaultValue: null,
                    type: DataTypes.STRING(128),
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
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: DataTypes.INTEGER,
                },
                isEmailConfirmed: {
                    allowNull: true,
                    defaultValue: null,
                    type: DataTypes.BOOLEAN,
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
                status: {
                    allowNull: true,
                    defaultValue: ActiveStatusType.OFFLINE,
                    type: DataTypes.SMALLINT,
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
                blocked: {
                    allowNull: false,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: DataTypes.INTEGER,
                },
                reason: {
                    allowNull: true,
                    type: DataTypes.STRING(128),
                },
                sender: {
                    allowNull: false,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
            },
            {
                sequelize: this.sqlize,
                tableName: "bucklesblocks",
                timestamps: true,
                underscored: true,
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
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: DataTypes.INTEGER,
                },
                recipient: {
                    allowNull: false,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
                sender: {
                    allowNull: false,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
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
                underscored: true,
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
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: DataTypes.INTEGER,
                },
                sender: {
                    allowNull: false,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                username: {
                    allowNull: false,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
            },
            {
                sequelize: this.sqlize,
                tableName: "bucklesfriendrequests",
                timestamps: true,
                underscored: true,
            },
        );
        this.chatRoomRepo = ChatRoom.init(
            {
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                createdBy: {
                    allowNull: true,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
                description: {
                    allowNull: true,
                    type: DataTypes.STRING(256),
                },
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: DataTypes.INTEGER,
                },
                name: {
                    allowNull: false,
                    type: DataTypes.STRING(128),
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
            },
            {
                sequelize: this.sqlize,
                tableName: "buckleschatrooms",
                timestamps: true,
                underscored: true,
            },
        );
        this.messageRepo = Message.init(
            {
                chatRoom: {
                    allowNull: true,
                    type: DataTypes.INTEGER,
                },
                content: {
                    allowNull: false,
                    type: DataTypes.STRING(280),
                },
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: DataTypes.INTEGER,
                },
                receiver: {
                    allowNull: true,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
                sender: {
                    allowNull: false,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
                thread: {
                    allowNull: true,
                    type: DataTypes.INTEGER,
                },
                threadOrder: {
                    allowNull: true,
                    type: DataTypes.INTEGER,
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
            },
            {
                sequelize: this.sqlize,
                tableName: "bucklesmessages",
                timestamps: true,
                underscored: true,
            },
        );
        this.threadRepo = Thread.init(
            {
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
                creator: {
                    allowNull: false,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: DataTypes.INTEGER,
                },
                receiver: {
                    allowNull: true,
                    references: {
                        key: "id",
                        model: User,
                    },
                    type: DataTypes.INTEGER,
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE,
                },
            },
            {
                sequelize: this.sqlize,
                tableName: "bucklesthreads",
                timestamps: true,
                underscored: true,
            },
        );
    }
}
