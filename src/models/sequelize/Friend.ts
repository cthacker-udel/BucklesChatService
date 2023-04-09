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
    modelName: "bucklesfriends",
    underscored: true,
})
export class Friend extends Model {
    @AllowNull(false)
    @ForeignKey(() => User)
    @Column(DataType.STRING(128))
    recipient: string;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column(DataType.STRING(128))
    sender: string;

    @AllowNull(true)
    @Column(DataType.BIGINT)
    accepted: number;

    @AllowNull(true)
    @Column(DataType.DATE)
    updatedAt: Date;

    @AllowNull(true)
    @Column(DataType.DATE)
    createdAt: Date;
}
