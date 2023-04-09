/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Table,
    Model,
    Column,
    DataType,
    AllowNull,
    ForeignKey,
} from "sequelize-typescript";
import { User } from "./User";

@Table({
    freezeTableName: true,
    modelName: "bucklesfriendrequests",
    underscored: true,
})
export class FriendRequest extends Model {
    @AllowNull(false)
    @ForeignKey(() => User)
    @Column(DataType.STRING(70))
    username: string;

    @AllowNull(true)
    @Column(DataType.STRING(128))
    customMessage: string;

    @AllowNull(true)
    @Column(DataType.BIGINT)
    sent: number;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column(DataType.STRING(70))
    sender: string;

    @AllowNull(true)
    @Column(DataType.DATE)
    createdAt: Date;

    @AllowNull(true)
    @Column(DataType.DATE)
    updatedAt: Date;
}
