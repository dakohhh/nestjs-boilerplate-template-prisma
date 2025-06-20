import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { MailModule } from "src/mail/mail.module";
import { AuthController } from "./auth.controller";
import { PassportModule } from "@nestjs/passport";
import { TokenModule } from "src/token/token.module";
import { UsersModule } from "src/users/users.module";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { FacebookOauthStrategy } from "./strategies/facebook-oauth.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";

@Module({
  imports: [PassportModule, TokenModule, UsersModule, MailModule],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, LocalStrategy, FacebookOauthStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
