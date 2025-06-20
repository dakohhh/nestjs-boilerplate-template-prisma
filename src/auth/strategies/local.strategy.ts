import { User } from "@prisma/client";
import { Strategy } from "passport-local";
import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { PassportStrategy } from "@nestjs/passport";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: "email",
      passwordField: "password",
    });
  }

  async validate(username: string, password: string): Promise<Partial<User>> {
    return await this.authService.validateUser(username, password);
  }
}
