#!/usr/bin/env node
import { NestFactory } from "@nestjs/core";
import { CommandModule, CommandService } from "nestjs-command";
import { Module } from "@nestjs/common";

@Module({
  imports: [CommandModule],
  providers: [],
})
class CliModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CliModule, {
    logger: ["error", "debug"], // only errors
  });

  try {
    await app.select(CommandModule).get(CommandService).exec();
    await app.close();
  } catch (error) {
    console.error(error);
    await app.close();
    process.exit(1);
  }
}
bootstrap();
