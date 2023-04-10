/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Model,
    InferAttributes,
    InferCreationAttributes,
} from "@sequelize/core";

export class Block extends Model<
    InferAttributes<Block>,
    InferCreationAttributes<Block>
> {
    declare username: string;
    declare reason?: string;
    declare sender: string;
    declare createdAt?: Date;
    declare updatedAt?: Date;
}
