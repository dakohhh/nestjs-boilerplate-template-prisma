import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Strategy, Profile } from "passport-facebook";
import { PassportStrategy } from "@nestjs/passport";
import { User } from "@prisma/client";
import { UsersService } from "src/users/users.service";

@Injectable()
export class FacebookOauthStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService
  ) {
    super({
      clientID: config.get("CONFIGS.FACEBOOK.FACEBOOK_APP_ID"),
      clientSecret: config.get("CONFIGS.FACEBOOK.FACEBOOK_APP_SECRET"),
      callbackURL: config.get("CONFIGS.FACEBOOK.FACEBOOK_CALLBACK_URL"),
      scope: "email",
      profileFields: ["id", "email", "name"],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: (err: any, user?: any, info?: any) => void) {
    const user: Partial<User> = {
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      provider: "FACEBOOK",
      providerId: profile.id,
    };
    done(null, user);
  }
}
