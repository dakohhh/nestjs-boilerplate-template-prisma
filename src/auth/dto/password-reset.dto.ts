import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PasswordResetDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resetOtp: string;
}

export class RequestPasswordResetDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class RequestPasswordResetResponseDto {
  @ApiPropertyOptional({ type: String })
  user_id?: string;
}
