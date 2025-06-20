import { JwtModule } from "@nestjs/jwt";
import { APP_FILTER } from "@nestjs/core";
import { RedisClientOptions } from "redis";
import { AppGateway } from "./app.gateway";
import { AppService } from "./app.service";
import { AwsModule } from "./aws/aws.module";
import { CommandModule } from "nestjs-command";
import { MailModule } from "./mail/mail.module";
import { AuthModule } from "./auth/auth.module";
import { AppController } from "./app.controller";
import { UsersModule } from "./users/users.module";
import { TokenModule } from "./token/token.module";
import { CacheModule } from "@nestjs/cache-manager";
import configuration, { CONFIGS } from "../configs";
import { CommonModule } from "./common/common.module";
import * as redisStore from "cache-manager-redis-store";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { LoggerMiddleware } from "./common/middlewares/logger.middleware";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { RedisOMModule } from "./redisom/redisom.module";
import { SocketUserModule } from "./socket-user/socket-user.module";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import { SocketUser, SocketUserSchema } from "./socket-user/socket-user.entity";
import { BullModule } from "@nestjs/bull";
import { FileModule } from "./file/file.module";
import { PaystackModule } from "./paystack/paystack.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    SentryModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get<string>("CONFIGS.REDIS_URI"),
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    CacheModule.register<RedisClientOptions>({ isGlobal: true, store: redisStore, url: CONFIGS.REDIS_URI }),
    MailModule,
    JwtModule,
    UsersModule,
    AwsModule,
    AuthModule,
    TokenModule,
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CommandModule,
    CommonModule,
    WebhooksModule,
    RedisOMModule,
    RedisOMModule.forFeature([{ entity: SocketUser, schema: SocketUserSchema }]),
    SocketUserModule,
    FileModule,
    PaystackModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }, AppService, AppGateway],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
