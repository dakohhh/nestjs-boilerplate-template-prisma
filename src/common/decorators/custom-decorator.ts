import { applyDecorators, createParamDecorator, ExecutionContext, Type } from "@nestjs/common";
import { ApiExtraModels, ApiInternalServerErrorResponse, ApiQuery, ApiResponse, getSchemaPath } from "@nestjs/swagger";

import { PaginationDto } from "../dto/pagination.dto";
import { CustomError } from "src/common/filters/all-exception.filter";
import { HttpResponse } from "src/common/dto/http-response.dto";

function isPrimitive(type: any): boolean {
  return [String, Boolean, Number].includes(type);
}

export function ApiHttpResponse<T>({ status, type, description, isArray }: { status: number | "default" | "1XX" | "2XX" | "3XX" | "4XX" | "5XX"; type: T | string | boolean | number; description?: string; isArray?: boolean }) {
  return applyDecorators(
    // Add the HttpResponse model to the global schema, and the type model if it's not a primitive
    ApiExtraModels(HttpResponse, ...(isPrimitive(type) ? [] : [type as Type<T>])),
    ApiResponse({
      status,
      description,
      schema: {
        // Use allOf to combine the HttpResponse model and the type model
        allOf: [
          // Add the HttpResponse model to the schema
          { $ref: getSchemaPath(HttpResponse) },
          // If the type is a primitive, add it to the schema directly, otherwise add a reference to the type
          {
            properties: {
              data: (() => {
                if (isPrimitive(type)) {
                  return isArray ? { type: "array", items: { type: typeof type === "function" ? type.name.toLowerCase() : type.toString().toLowerCase() } } : { type: typeof type === "function" ? type.name.toLowerCase() : type.toString().toLowerCase() };
                }
                return isArray ? { type: "array", items: { $ref: getSchemaPath(type as Type<T>) } } : { $ref: getSchemaPath(type as Type<T>) };
              })(),
            },
          },
        ],
      },
    })
  );
}

export function ApiHttpErrorResponses() {
  return applyDecorators(
    // breaker
    ApiResponse({ status: "4XX", type: CustomError, description: "Bad Request - All 4XX errors" }),
    ApiInternalServerErrorResponse({ type: CustomError, description: "Internal Server Error" })
  );
}

export const ApiPaginationQuery = () => {
  return applyDecorators(
    // breaker
    ApiQuery({ name: "page", required: false, type: Number, description: "Page number" }),
    ApiQuery({ name: "limit", required: false, type: Number, description: "Number of items per page" })
  );
};

export const PaginationQuery = createParamDecorator((data: unknown, ctx: ExecutionContext): PaginationDto => {
  const request = ctx.switchToHttp().getRequest();
  const query = request.query;

  let { page = 1, limit = 10 } = query;

  page = parseInt(page);
  if (isNaN(page) || page < 1) page = 1;

  limit = parseInt(limit);
  if (isNaN(limit) || limit < 1) limit = 10;

  return { page, limit };
});
