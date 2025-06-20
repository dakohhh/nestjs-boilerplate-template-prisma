import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { UsersService } from "src/users/users.service";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService
  ) {
    super({
      ignoreExpiration: false,
      secretOrKey: config.get("CONFIGS.JWT_SECRET"),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: any) {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid Token Type");
    }
    const user = await this.usersService.getById(payload.sub);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }
}
