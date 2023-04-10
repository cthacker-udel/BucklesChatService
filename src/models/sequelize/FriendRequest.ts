/* eslint-disable @typescript-eslint/indent -- disabled */
import {
    Model,
    InferAttributes,
    InferCreationAttributes,
} from "@sequelize/core";

export class FriendRequest extends Model<
    InferAttributes<FriendRequest>,
    InferCreationAttributes<FriendRequest>
> {
    declare username: string;
    declare customMessage?: string;
    declare sender: string;
    declare createdAt?: Date;
    declare updatedAt?: Date;
}
