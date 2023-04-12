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
    declare chatRoom: string;
    declare content: string;
    declare createdAt?: Date;
    declare receiver?: string;
    declare sender: string;
    declare senderProfilePictureUrl: string;
    declare updatedAt?: Date;
}
