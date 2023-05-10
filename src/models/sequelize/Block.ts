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
    declare blocked: number;
    declare reason?: string;
    declare sender: number;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare id?: number;
}
