import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RequestEmailVerificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class EmailVerificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  verificationOtp: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;
}
