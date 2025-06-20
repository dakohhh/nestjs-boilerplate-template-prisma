import { Entity, Schema } from "redis-om";

export class SocketUser extends Entity {
  userId?: string;
  socketId?: string;
}

export const SocketUserSchema = new Schema(SocketUser, {
  userId: { type: "string" },
  socketId: { type: "string" },
});
