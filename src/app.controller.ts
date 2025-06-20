import { AppService } from "./app.service";
import { Controller, Get, HttpException } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CustomError } from "./common/filters/all-exception.filter";

@ApiTags("App")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: "Welcome Message" })
  @ApiResponse({ status: 200, type: String, description: "Returns a welcome message" })
  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @ApiOperation({ summary: "Error Message" })
  @ApiResponse({ status: 500, type: CustomError, description: "Throws an error" })
  @Get("/error")
  getError() {
    throw new HttpException("My first Sentry error!", 500);
  }
}
