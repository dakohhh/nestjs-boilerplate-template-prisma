// redisom.service.ts
import { Client } from "redis-om";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RedisOMService implements OnModuleInit {
  private client: Client | null = null;
  private clientPromise: Promise<Client> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.getOrCreateClient();
  }

  async getOrCreateClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    if (!this.clientPromise) {
      this.clientPromise = this.initClient();
    }

    this.client = await this.clientPromise;
    return this.client;
  }

  private async initClient(): Promise<Client> {
    const client = new Client();
    const redisUri = this.configService.get("CONFIGS.REDIS_URI");

    if (!redisUri) {
      throw new Error("Redis URI is not defined in configuration");
    }

    await client.open(redisUri);
    return client;
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error("Redis client not initialized. Use getOrCreateClient instead.");
    }
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
  }
}
