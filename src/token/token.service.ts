import { User } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { TokenBackend } from "./token.backend";
import { RefreshToken, Token, TokenType } from "./tokens";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TokenService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly tokenBackend: TokenBackend
  ) {}

  async generateAuthTokens(user: Pick<User, "id">) {
    // Generate the refresh token
    const refreshToken = new RefreshToken({
      sub: user.id,
      exp: new Date(Date.now() + this.configService.get("CONFIGS.REFRESH_TOKEN_JWT_EXPIRES_IN")),
    });

    const accessToken = refreshToken.getAccessToken({
      expiresIn: this.configService.get<number>("CONFIGS.ACCESS_TOKEN_JWT_EXPIRES_IN"),
    });

    const tokens = { accessToken: this.tokenBackend.encodeToken(accessToken), refreshToken: this.tokenBackend.encodeToken(refreshToken) };

    await this.prismaService.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id, expiresAt: refreshToken.exp } });

    return tokens;
  }

  async refreshAuthTokens(user: User, refreshToken: string) {
    const token = await this.prismaService.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!token) throw new HttpException("Invalid token", HttpStatus.UNAUTHORIZED);

    if (token.isRevoked) throw new HttpException("Refresh token revoked", HttpStatus.UNAUTHORIZED);

    if (token.expiresAt < new Date()) throw new HttpException("Refresh token expired", HttpStatus.UNAUTHORIZED);

    if (this.configService.get("CONFIGS.ROTATE_REFRESH_TOKENS")) {
      await this.prismaService.refreshToken.update({ where: { id: token.id }, data: { isRevoked: true } });
    }

    return this.generateAuthTokens(user);
  }

  async revokeRefreshToken(user: User, refreshToken: string) {
    const token = await this.prismaService.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!token) throw new HttpException("Invalid token", HttpStatus.UNAUTHORIZED);

    await this.prismaService.refreshToken.update({ where: { id: token.id }, data: { isRevoked: true } });
  }
}
