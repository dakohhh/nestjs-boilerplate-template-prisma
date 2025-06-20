import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "wisdomdakoh@gmail.com" })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: "wisdom" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: "Wisdom" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Dakoh" })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
