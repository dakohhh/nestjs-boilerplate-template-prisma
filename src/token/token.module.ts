import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TokenBackend } from "./token.backend";
import { TokenService } from "./token.service";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  providers: [TokenBackend, TokenService],
  exports: [TokenService],
})
export class TokenModule {}
