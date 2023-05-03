/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Model,
    InferAttributes,
    InferCreationAttributes,
} from "@sequelize/core";

export class Thread extends Model<
    InferAttributes<Thread>,
    InferCreationAttributes<Thread>
> {
    declare id?: number;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare creator: number;
    declare receiver: number;
}
