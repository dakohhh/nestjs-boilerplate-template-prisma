import { User } from "@prisma/client";
import { UpdatePasswordDto } from "./user.dto";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { HttpResponse } from "src/common/dto/http-response.dto";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request, Controller, Get, UseGuards, HttpStatus, Patch, Body } from "@nestjs/common";
import { ApiHttpErrorResponses, ApiHttpResponse, ApiPaginationQuery, PaginationQuery } from "src/common/decorators/custom-decorator";

@ApiTags("Users")
@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Get User Session" })
  @ApiBearerAuth()
  @ApiHttpErrorResponses()
  @Get("session")
  @UseGuards(JwtAuthGuard)
  async getUserSession(@Request() req: Request & { user: User }) {
    return new HttpResponse("User session", req.user, HttpStatus.OK);
  }

  @ApiOperation({ summary: "Update User Password" })
  @ApiBearerAuth()
  @ApiHttpErrorResponses()
  @ApiHttpResponse({ status: 200, type: Boolean, description: "Updates the user's password" })
  @Patch("update-password")
  @UseGuards(JwtAuthGuard)
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto, @Request() req: Request & { user: User }) {
    const result = await this.usersService.updatePassword(req.user, updatePasswordDto);
    return new HttpResponse("Password updated successfully", result, HttpStatus.OK);
  }
}
