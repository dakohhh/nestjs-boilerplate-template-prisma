import { Module } from "@nestjs/common";
import { RedisOMModule } from "src/redisom/redisom.module";
import { SocketUser, SocketUserSchema } from "./socket-user.entity";

@Module({
  imports: [RedisOMModule.forFeature([{ entity: SocketUser, schema: SocketUserSchema }])],
})
export class SocketUserModule {}
