import { ApiProperty } from "@nestjs/swagger";

export class PaginationDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class PaginationResponseDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total_pages: number;

  @ApiProperty()
  total_docs: number;
}
