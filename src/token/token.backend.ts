import { Algorithm } from "jsonwebtoken";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TokenBackendError } from "./token.error";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { AccessToken, RefreshToken, Token, TokenType } from "./tokens";

@Injectable()
export class TokenBackend {
  private readonly secret: string;
  private readonly algorithm: Algorithm;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.secret = this.configService.get<string>("CONFIGS.JWT_SECRET")!;
    this.algorithm = this.configService.get<Algorithm>("CONFIGS.JWT_ALGORITHM")!;
    this.validateAlgorithm();
  }

  private readonly allowedAlgorithms: Algorithm[] = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384", "ES512"];

  private validateAlgorithm(): void {
    if (!this.allowedAlgorithms.includes(this.algorithm)) {
      throw new TokenBackendError(`Invalid algorithm: ${this.algorithm}. Allowed: ${this.allowedAlgorithms.join(", ")}`);
    }
  }

  encodeToken(token: Token): string {
    const payload = {
      ...token,
      exp: token.exp ? Math.floor(token.exp.getTime() / 1000) : undefined,
      iat: token.iat ? Math.floor(token.iat.getTime() / 1000) : undefined,
    };

    const options: JwtSignOptions = {
      algorithm: this.algorithm,
      secret: this.secret,
    };

    return this.jwtService.sign(payload, options);
  }

  decodeToken(tokenStr: string, verify = true): Token {
    try {
      const decoded = this.jwtService.verify(tokenStr, {
        secret: this.secret,
        ignoreExpiration: !verify,
        algorithms: [this.algorithm as Algorithm],
      });

      const payload = {
        ...decoded,
        exp: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
        iat: decoded.iat ? new Date(decoded.iat * 1000) : undefined,
      };

      if (decoded.type === TokenType.ACCESS) {
        return new AccessToken(payload);
      } else if (decoded.type === TokenType.REFRESH) {
        return new RefreshToken(payload);
      } else {
        throw new TokenBackendError("Unknown token type");
      }
    } catch (err) {
      throw new TokenBackendError(`Invalid token: ${err.message}`);
    }
  }
}
