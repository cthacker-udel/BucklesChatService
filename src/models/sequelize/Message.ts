/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Model,
    InferAttributes,
    InferCreationAttributes,
} from "@sequelize/core";

export class Message extends Model<
    InferAttributes<Message>,
    InferCreationAttributes<Message>
> {
    declare chatRoom?: string;
    declare content: string;
    declare createdAt?: Date;
    declare id?: number;
    declare receiver?: string;
    declare sender: string;
    declare updatedAt?: Date;
    declare thread?: number;
    declare threadOrder?: number;
}
