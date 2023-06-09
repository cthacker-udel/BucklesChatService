/* eslint-disable no-unused-vars -- disabled */
/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Model,
    InferAttributes,
    InferCreationAttributes,
} from "@sequelize/core";

export enum NotificationType {
    SENDING_MESSAGE = 0,
    SENDING_FRIEND_REQUEST = 1,
    ACCEPTED_FRIEND_REQUEST = 2,
    REJECTED_FRIEND_REQUEST = 3,
    REMOVED_FRIEND = 4,
}

export class Notification extends Model<
    InferAttributes<Notification>,
    InferCreationAttributes<Notification>
> {
    declare id?: number;
    declare sender: number;
    declare receiver: number;
    declare notificationType: NotificationType;
    declare createdAt?: Date;
    declare updatedAt?: Date;
}
