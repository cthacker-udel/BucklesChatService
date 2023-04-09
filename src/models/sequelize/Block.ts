/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Model,
    Table,
    Column,
    DataType,
    AllowNull,
    ForeignKey,
} from "sequelize-typescript";
import { User } from "./User";

@Table({
    freezeTableName: true,
    modelName: "bucklesblocks",
    underscored: true,
})
export class Block extends Model {
    @AllowNull(false)
    @ForeignKey(() => User)
    @Column(DataType.STRING(128))
    username: string;

    @AllowNull(true)
    @Column(DataType.STRING(128))
    reason: string;

    @AllowNull(true)
    @Column(DataType.BIGINT)
    blocked: number;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column(DataType.STRING(70))
    sender: string;

    @AllowNull(true)
    @Column(DataType.DATE)
    updatedAt: Date;

    @AllowNull(true)
    @Column(DataType.DATE)
    createdAt: Date;
}
