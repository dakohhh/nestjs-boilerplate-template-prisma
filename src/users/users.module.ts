import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersService } from "./users.service";
import { AwsModule } from "src/aws/aws.module";
import { UsersController } from "./users.controller";
import { FileModule } from "src/file/file.module";

@Module({
  imports: [JwtModule.register({}), AwsModule, FileModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
