import bcryptjs from "bcryptjs";
import { User } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { UpdatePasswordDto } from "./user.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  // User Retrieval Methods
  async getById(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user;
  }

  async updatePassword(user: User, updatePasswordDto: UpdatePasswordDto) {
    const isPasswordMatching = await bcryptjs.compare(updatePasswordDto.currentPassword, user.password);
    if (!isPasswordMatching) throw new UnauthorizedException("Current password is incorrect");

    const passwordHash = await bcryptjs.hash(updatePasswordDto.newPassword, this.configService.get("CONFIGS.BCRYPT_SALT"));

    await this.prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } });

    return true;
  }
}
