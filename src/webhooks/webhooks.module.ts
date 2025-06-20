import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { PaystackModule } from "src/paystack/paystack.module";

@Module({
  imports: [PaystackModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
