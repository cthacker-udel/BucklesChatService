/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Model,
    Table,
    Column,
    DataType,
    AllowNull,
    Unique,
} from "sequelize-typescript";

@Table({
    freezeTableName: true,
    modelName: "bucklesusers",
    underscored: true,
})
export class User extends Model {
    @AllowNull(true)
    @Column(DataType.STRING(70))
    firstName: string;

    @AllowNull(true)
    @Column(DataType.STRING(70))
    lastName: string;

    @AllowNull(true)
    @Column(DataType.STRING(120))
    email: string;

    @AllowNull(true)
    @Column(DataType.STRING(12))
    handle: string;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    dob: number;

    @AllowNull(false)
    @Unique(true)
    @Column(DataType.STRING(70))
    username: string;

    @AllowNull(false)
    @Column(DataType.STRING(128))
    password: string;

    @AllowNull(false)
    @Column(DataType.STRING(128))
    passwordSalt: string;

    @AllowNull(true)
    @Column(DataType.STRING(128))
    profileImageUrl: string;

    @AllowNull(true)
    @Column(DataType.STRING(128))
    profileImageRemovalUrl: string;

    @AllowNull(true)
    @Column(DataType.DATE)
    createdAt: Date;

    @AllowNull(true)
    @Column(DataType.DATE)
    updatedAt: Date;
}
