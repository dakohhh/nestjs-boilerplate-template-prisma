import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    return `Welcome to ${this.configService.get("CONFIGS.APP_NAME")}. Hello World!`;
  }
}
