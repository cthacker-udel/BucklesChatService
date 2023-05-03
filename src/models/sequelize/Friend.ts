/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Model,
    InferAttributes,
    InferCreationAttributes,
} from "@sequelize/core";

export class Friend extends Model<
    InferAttributes<Friend>,
    InferCreationAttributes<Friend>
> {
    declare recipient: number;
    declare sender: number;
    declare accepted?: number;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare id?: number;
}
