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
    declare username: number;
    declare customMessage?: string;
    declare sender: number;
    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare id?: number;
}
