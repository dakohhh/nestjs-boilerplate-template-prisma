import "./sentry";
import { NestFactory } from "@nestjs/core";
import basicAuth from "express-basic-auth";
import { CONFIGS, APP_VERSION } from "../configs";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
//import { Logger } from "@nestjs/common";
import express, { json } from "express";
import { Request, Response, NextFunction } from "express";

import { AppModule } from "./app.module";
import { RedisIoAdapter } from "./common/adapters/redis-adapter";
import { AllExceptionFilter } from "./common/filters/all-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable the built-in body parser
  });

  // Custom middleware to handle raw body
  app.use("/v1/webhooks/webhook/stripe", express.raw({ type: "*/*" }));

  // Use JSON parser for all other routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === "/v1/webhooks/webhook/stripe") {
      next();
    } else {
      json()(req, res, next);
    }
  });

  // Rest of your configuration
  app.use([CONFIGS.SWAGGER.PATH, `${CONFIGS.SWAGGER.PATH}-json`, `${CONFIGS.SWAGGER.PATH}-yaml`], basicAuth({ challenge: true, users: { admin: CONFIGS.SWAGGER.PASSWORD } }));

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);
  app.enableCors({ credentials: true, origin: [...CONFIGS.CORS_ALLOWED_ORIGINS] });
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionFilter());

  const swaggerConfig = new DocumentBuilder().setTitle(CONFIGS.APP_NAME).setDescription(CONFIGS.APP_DESCRIPTION).setVersion(APP_VERSION).setExternalDoc("View in YAML", `${CONFIGS.SWAGGER.PATH}-yaml`).addBearerAuth().build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(CONFIGS.SWAGGER.PATH, app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
