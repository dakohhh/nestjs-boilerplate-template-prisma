import { ApiProperty } from "@nestjs/swagger";

export class HttpResponse<T> {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: "object" })
  data: T;

  @ApiProperty()
  status_code: number;

  constructor(message: string, data: T, statusCode: number = 200) {
    this.message = message;
    this.data = data;
    this.status_code = statusCode;
  }
}
