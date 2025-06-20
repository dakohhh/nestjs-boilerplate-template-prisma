import { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { WebhooksService } from "./webhooks.service";
import { PaystackService } from "src/paystack/paystack.service";
import { Controller, Logger, Post, Req, Res } from "@nestjs/common";

@Controller({ path: "webhooks", version: "1" })
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly paystackService: PaystackService,
    private readonly webhookService: WebhooksService
  ) {}

  @Post("webhook/paystack")
  async paystackWebHook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers["x-paystack-signature"];
    const signature = Array.isArray(sig) ? sig[0] : sig;

    const isValid = await this.paystackService.verifyPaystackWebHook(req.body, signature);

    if (isValid) {
      switch (req.body.event) {
        case "charge.success":
          this.webhookService.PaystackSubscriptionEvent({ ...req.body });
          break;

        case "subscription.create":
          this.webhookService.paystackUpdateSubscriptionEvent({ ...req.body });
          break;

        case "subscription.disable":
          this.webhookService.paystackCancelSubscriptionEvent({ ...req.body });
          break;
        case "subscription.not_renew":
          this.webhookService.paystackSubscriptionNotRenewEvent({ ...req.body });
          break;
        default:
          break;
      }

      res.json({ received: true });
    } else {
      throw new Error("Invalid event");
    }
  }
}
