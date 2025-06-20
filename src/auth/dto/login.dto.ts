import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "wisdomdakoh@gmail.com" })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "wisdom" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
