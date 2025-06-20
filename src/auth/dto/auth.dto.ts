import { User } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { IsNotEmpty } from "class-validator";

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class AuthenticationResponseDto {
  @ApiProperty()
  user: User;

  @ApiProperty()
  token: AuthTokensDto;
}

export class RefreshTokenDto {
  @ApiProperty({ description: "The refresh token to be refreshed" })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
