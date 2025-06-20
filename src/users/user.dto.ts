import { Type } from "class-transformer";
import { User } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationResponseDto } from "src/common/dto/pagination.dto";
import { IsNotEmpty, IsOptional, IsString, IsDateString, IsEnum, IsNumber, ValidateNested } from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firsName?: string;
}

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
