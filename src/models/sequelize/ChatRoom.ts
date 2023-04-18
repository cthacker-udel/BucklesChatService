/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Model,
    InferAttributes,
    InferCreationAttributes,
} from "@sequelize/core";

export class ChatRoom extends Model<
    InferAttributes<ChatRoom>,
    InferCreationAttributes<ChatRoom>
> {
    declare createdAt?: Date;
    declare createdBy: string;
    declare description: string;
    declare name: string;
    declare updatedAt?: Date;
    declare id?: number;
}
