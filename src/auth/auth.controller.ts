import { User } from "@prisma/client";
import { LoginDto } from "./dto/login.dto";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { HttpResponse } from "src/common/dto/http-response.dto";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthTokensDto, RefreshTokenDto, AuthenticationResponseDto } from "./dto/auth.dto";
import { ApiHttpErrorResponses, ApiHttpResponse } from "src/common/decorators/custom-decorator";
import { FacebookOauthGuard } from "./guards/facebook-oauth.guard";
import { EmailVerificationDto, RequestEmailVerificationDto } from "./dto/email-verification.dto";
import { PasswordResetDto, RequestPasswordResetDto, RequestPasswordResetResponseDto } from "./dto/password-reset.dto";
import { Body, Request, Controller, Post, UseGuards, HttpStatus, HttpCode, Get, Res } from "@nestjs/common";
import { Response } from "express";

@ApiTags("Authentication")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @ApiOperation({ summary: "Register" })
  @ApiHttpErrorResponses()
  @ApiHttpResponse({ status: 201, type: AuthenticationResponseDto, description: "Registers a new user" })
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return new HttpResponse("User registered", result, HttpStatus.CREATED);
  }

  @ApiOperation({ summary: "Login" })
  @ApiHttpErrorResponses()
  @ApiBody({ type: LoginDto })
  @ApiHttpResponse({ status: 200, type: AuthenticationResponseDto, description: "Logs in a user" })
  @HttpCode(200)
  @Post("login")
  @UseGuards(LocalAuthGuard)
  async login(@Request() req: Request & { user: User }) {
    console.log(req.user);
    const result = await this.authService.login(req.user);
    return new HttpResponse("User logged in", result, HttpStatus.OK);
  }

  @ApiOperation({ summary: "Refresh Tokens" })
  @ApiHttpErrorResponses()
  @ApiBody({ type: RefreshTokenDto })
  @ApiHttpResponse({ status: 200, type: AuthTokensDto, description: "Refreshes the access token and refresh token" })
  @HttpCode(200)
  @Post("refresh-tokens")
  @UseGuards(JwtRefreshGuard)
  async refreshTokens(@Request() req: Request & { user: User }, @Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshAuthTokens(req.user, refreshTokenDto.refreshToken);
    return new HttpResponse("Tokens refreshed", result, HttpStatus.OK);
  }

  @ApiOperation({ summary: "Logout" })
  @ApiHttpErrorResponses()
  @ApiBody({ type: RefreshTokenDto })
  @ApiHttpResponse({ status: 200, type: Boolean, description: "Logs out a user, by revoking the refresh token" })
  @HttpCode(200)
  @Post("logout")
  @UseGuards(JwtRefreshGuard)
  async logout(@Request() req: Request & { user: User }, @Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.revokeRefreshToken(req.user, refreshTokenDto.refreshToken);
    return new HttpResponse("User logged out", result, HttpStatus.OK);
  }

  @ApiOperation({ summary: "Session" })
  @ApiBearerAuth()
  @ApiHttpErrorResponses()
  @ApiHttpResponse({ status: 200, type: AuthenticationResponseDto, description: "Gets the session of a user" })
  @UseGuards(JwtAuthGuard)
  @Get("session")
  async session(@Request() req: Request & { user: User }) {
    return new HttpResponse("User session", req.user, HttpStatus.OK);
  }

  @ApiOperation({ summary: "Request Email Verification" })
  @ApiHttpErrorResponses()
  @ApiBody({ type: RequestEmailVerificationDto })
  @ApiHttpResponse({ status: 200, type: Boolean, description: "Requests email verification for a user" })
  @HttpCode(200)
  @Post("request-email-verification")
  async requestEmailVerification(@Body() requestEmailVerificationDto: RequestEmailVerificationDto) {
    const result = await this.authService.requestEmailVerification(requestEmailVerificationDto);
    return new HttpResponse("Email verification requested", result, HttpStatus.OK);
  }

  @ApiOperation({ summary: "Verify Email" })
  @ApiHttpErrorResponses()
  @ApiBody({ type: EmailVerificationDto })
  @ApiHttpResponse({ status: 200, type: Boolean, description: "Verifies the email of a user" })
  @HttpCode(200)
  @Post("verify-email")
  async verifyEmail(@Body() emailVerificationDto: EmailVerificationDto) {
    const result = await this.authService.verifyEmail(emailVerificationDto);
    return new HttpResponse("Email verified", result, HttpStatus.OK);
  }

  @ApiOperation({ summary: "Request Password Reset" })
  @ApiHttpErrorResponses()
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiHttpResponse({ status: 200, type: RequestPasswordResetResponseDto, description: "Requests password reset for a user" })
  @HttpCode(200)
  @Post("request-password-reset")
  async requestPasswordReset(@Body() requestResetPasswordDto: RequestPasswordResetDto) {
    const result = await this.authService.requestPasswordReset(requestResetPasswordDto);
    return new HttpResponse("Password reset requested", result, HttpStatus.OK);
  }

  @ApiOperation({ summary: "Reset Password" })
  @ApiHttpErrorResponses()
  @ApiBody({ type: PasswordResetDto })
  @ApiHttpResponse({ status: 200, type: Boolean, description: "Resets the password of a user" })
  @HttpCode(200)
  @Post("reset-password")
  async resetPassword(@Body() passwordResetDto: PasswordResetDto) {
    const result = await this.authService.resetPassword(passwordResetDto);
    return new HttpResponse("Password reset", result, HttpStatus.OK);
  }

  @ApiOperation({ summary: "Facebook Auth" })
  @ApiHttpErrorResponses()
  @ApiHttpResponse({ status: 200, type: AuthenticationResponseDto, description: "Logs in a user using Facebook OAuth" })
  @HttpCode(200)
  @Get("facebook")
  @UseGuards(FacebookOauthGuard)
  async facebookAuth() {}

  @ApiOperation({ summary: "Facebook Auth Callback" })
  @ApiHttpErrorResponses()
  @ApiHttpResponse({ status: 200, type: AuthenticationResponseDto, description: "Logs in a user using Facebook OAuth" })
  @UseGuards(FacebookOauthGuard)
  @Get("facebook/callback")
  async facebookAuthCallback(@Request() req: Request & { user: User }, @Res() res: Response) {
    const result = await this.authService.oauthFacebookLogin(req.user);

    res.cookie("accessToken", result.token.accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>("DEPLOYMENT_ENV") === "production",
      sameSite: this.configService.get<string>("DEPLOYMENT_ENV") === "production" ? "strict" : "lax",
      maxAge: 1000 * 60 * 15,
    });

    res.cookie("refreshToken", result.token.refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>("DEPLOYMENT_ENV") === "production",
      sameSite: this.configService.get<string>("DEPLOYMENT_ENV") === "production" ? "strict" : "lax",
      maxAge: 1000 * 60 * 15,
    });

    return res.redirect(`${this.configService.get("CONFIGS.URLS.FRONTEND_BASE_URL")}/dashboard`);
  }
}
