import bcryptjs from "bcryptjs";
import moment from "moment";
import { User, Provider } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { RegisterDto } from "./dto/register.dto";
import { MailService } from "src/mail/mail.service";
import { PrismaService } from "src/prisma/prisma.service";
import { PasswordResetDto, RequestPasswordResetDto } from "./dto/password-reset.dto";
import { EmailVerificationDto, RequestEmailVerificationDto } from "./dto/email-verification.dto";
import { BadRequestException, UnauthorizedException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { TokenService } from "src/token/token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService
  ) {}

  async validateUser(email: string, password: string): Promise<Partial<User>> {
    const user = await this.prismaService.user.findUnique({ where: { email }, select: { id: true, password: true, firstName: true, lastName: true, provider: true } });
    if (!user) throw new BadRequestException("Incorrect email or password");
    if (user.provider !== Provider.DEFAULT) {
      throw new UnauthorizedException(`This account was created with ${user.provider}. Please log in with ${user.provider}.`);
    }
    const isPasswordMatching = await bcryptjs.compare(password, user.password);
    if (!isPasswordMatching) throw new UnauthorizedException("Incorrect email or password");
    const { password: _, ...cleanedUser } = user;
    return cleanedUser;
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prismaService.user.findUnique({ where: { email: registerDto.email } });
    if (existingUser) {
      throw new HttpException("Email already exists", HttpStatus.BAD_REQUEST);
    }
    const passwordHash = await bcryptjs.hash(registerDto.password, this.configService.get("CONFIGS.BCRYPT_SALT"));
    const user = await this.prismaService.user.create({
      data: {
        email: registerDto.email,
        password: passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      },
    });
    const token = await this.tokenService.generateAuthTokens(user);
    return { user, token };
  }

  async login(user: User) {
    const token = await this.tokenService.generateAuthTokens(user);
    const { password, verificationOtp, verificationOtpExpiresAt, providerId, passwordResetOtp, passwordResetOtpExpiresAt, createdAt, updatedAt, emailVerified, ...cleanedUser } = user;
    return { cleanedUser, token };
  }

  async oauthFacebookLogin(user: User) {
    //  Find the user
    const existingUser = await this.prismaService.user.findFirst({
      where: { email: user.email },
    });

    if (existingUser) {
      if (existingUser.provider !== Provider.FACEBOOK) {
        throw new UnauthorizedException(`This account was created with ${existingUser.provider}. Please log in using ${existingUser.provider}.`);
      }
      return this.login(existingUser);
    }

    if (existingUser) {
      return this.login(existingUser);
    }
    const newUser = await this.prismaService.user.create({
      data: {
        email: user.email,
        provider: Provider.FACEBOOK,
        providerId: user.providerId,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: true,
      },
    });
    return this.login(newUser);
  }

  async requestEmailVerification(requestEmailVerificationDto: RequestEmailVerificationDto) {
    const user = await this.prismaService.user.findUnique({ where: { email: requestEmailVerificationDto.email }, select: { id: true, email: true, emailVerified: true } });
    if (user) {
      if (user.emailVerified) throw new HttpException("Email already verified", HttpStatus.BAD_REQUEST);

      // Create 6 digit verification OTP
      const verificationOtp = Math.floor(100000 + Math.random() * 900000);

      const hashedOtp = await bcryptjs.hash(verificationOtp.toString(), this.configService.get("CONFIGS.BCRYPT_SALT"));

      const verificationOtpExpiresAt = moment().add(10, "minutes").toDate();

      await this.prismaService.user.update({
        where: { id: user.id },
        data: { verificationOtp: hashedOtp, verificationOtpExpiresAt },
      });

      await this.mailService.sendEmailVerificationEmail(user.email, verificationOtp.toString());

      return true;
    }
  }

  async verifyEmail(emailVerificationDto: EmailVerificationDto) {
    const user = await this.prismaService.user.findUnique({ where: { email: emailVerificationDto.email }, select: { id: true, email: true, emailVerified: true, verificationOtp: true, verificationOtpExpiresAt: true } });
    if (!user) throw new NotFoundException("User not found");
    if (user.emailVerified) throw new HttpException("Email already verified", HttpStatus.BAD_REQUEST);

    if (!user.verificationOtp) throw new HttpException("Invalid or expired token", HttpStatus.UNAUTHORIZED);

    const isVerificationOtpValid = await bcryptjs.compare(emailVerificationDto.verificationOtp, user.verificationOtp);

    const isVerificationOtpExpired = moment().isAfter(user.verificationOtpExpiresAt);

    if (!isVerificationOtpValid || isVerificationOtpExpired) throw new HttpException("Invalid or expired token", HttpStatus.UNAUTHORIZED);

    await this.prismaService.user.update({ where: { id: user.id }, data: { emailVerified: true, verificationOtp: null, verificationOtpExpiresAt: null } });

    return true;
  }

  async requestPasswordReset(requestResetPasswordDto: RequestPasswordResetDto) {
    const user = await this.prismaService.user.findUnique({ where: { email: requestResetPasswordDto.email }, select: { id: true, email: true } });

    if (user) {
      const resetOtp = Math.floor(100000 + Math.random() * 900000);
      const hashedOtp = await bcryptjs.hash(resetOtp.toString(), this.configService.get("CONFIGS.BCRYPT_SALT"));

      const resetOtpExpiresAt = moment().add(10, "minutes").toDate();

      await this.prismaService.user.update({ where: { id: user.id }, data: { passwordResetOtp: hashedOtp, passwordResetOtpExpiresAt: resetOtpExpiresAt } });
      await this.mailService.sendPasswordResetEmail(user.email, resetOtp.toString());
    }
  }

  async resetPassword(passwordResetDto: PasswordResetDto) {
    const user = await this.prismaService.user.findUnique({ where: { email: passwordResetDto.email }, select: { id: true, email: true, passwordResetOtp: true, passwordResetOtpExpiresAt: true } });
    if (!user) throw new NotFoundException("Invalid or expired token");

    if (!user.passwordResetOtp) throw new HttpException("Invalid or expired token", HttpStatus.UNAUTHORIZED);

    const isResetOtpValid = await bcryptjs.compare(passwordResetDto.resetOtp, user.passwordResetOtp);
    const isResetOtpExpired = moment().isAfter(user.passwordResetOtpExpiresAt);

    if (!isResetOtpValid || isResetOtpExpired) throw new HttpException("Invalid or expired token", HttpStatus.UNAUTHORIZED);

    const passwordHash = await bcryptjs.hash(passwordResetDto.newPassword, this.configService.get("CONFIGS.BCRYPT_SALT"));

    await this.prismaService.user.update({ where: { id: user.id }, data: { password: passwordHash, passwordResetOtp: null, passwordResetOtpExpiresAt: null } });
  }

  async refreshAuthTokens(user: User, refreshToken: string) {
    return this.tokenService.refreshAuthTokens(user, refreshToken);
  }

  async revokeRefreshToken(user: User, refreshToken: string) {
    return this.tokenService.revokeRefreshToken(user, refreshToken);
  }
}
