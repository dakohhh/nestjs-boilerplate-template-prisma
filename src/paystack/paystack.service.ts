import axios from "axios";
import crypto from "crypto";
import Paystack from "paystack";
// import { User } from "src/users/user.schema";
import { ConfigService } from "@nestjs/config";
// import { CreatePayStackSubscriptionDto } from "src/payments/dto/create-subscription.dt";
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";

@Injectable()
export class PaystackService {
  readonly paystackClient: Paystack;
  readonly secretKey: string;
  readonly baseUrl = this.configService.get<string>("CONFIGS.PAYSTACK.BASE_URL");
  private readonly ProMonthlyPriceId = this.configService.get<string>("CONFIGS.PAYSTACK_IDS.PRO.MONTHLY_PRICE_ID");
  private readonly ProYearlyPriceId = this.configService.get<string>("CONFIGS.PAYSTACK_IDS.PRO.YEARLY_PRICE_ID");
  private readonly PremiumMonthlyPriceId = this.configService.get<string>("CONFIGS.PAYSTACK_IDS.PREMIUM.MONTHLY_PRICE_ID");
  private readonly PremiumYearlyPriceId = this.configService.get<string>("CONFIGS.PAYSTACK_IDS.PREMIUM.YEARLY_PRICE_ID");

  private readonly logger = new Logger(PaystackService.name);
  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get("CONFIGS.PAYSTACK.SECRET_KEY");

    this.paystackClient = Paystack(this.secretKey);
  }

  async verifyPaystackWebHook(payload: any, signature: string) {
    const hash = crypto.createHmac("sha512", this.secretKey).update(JSON.stringify(payload)).digest("hex");
    return hash === signature;
  }

  async createPaystackUser(email: string) {
    return await this.paystackClient.customer.create({
      email,
    });
  }

  async processPaystackSubscription(user: any, plan: any, callback_url_success: string) {
    let priceId: string | undefined;
    let priceName: string | undefined;
    let accountType: string | undefined;

    switch (plan.plan_name) {
      case "pro":
        accountType = "pro";
        priceId = plan.plan_duration === "monthly" ? this.ProMonthlyPriceId : plan.plan_duration === "yearly" ? this.ProYearlyPriceId : undefined;
        priceName = plan.plan_duration === "monthly" ? "monthly pro plan" : plan.plan_duration === "yearly" ? "yearly pro plan" : undefined;
        break;

      case "premium":
        accountType = "premium";
        priceId = plan.plan_duration === "monthly" ? this.PremiumMonthlyPriceId : plan.plan_duration === "yearly" ? this.PremiumYearlyPriceId : undefined;
        priceName = plan.plan_duration === "monthly" ? "monthly premium plan" : plan.plan_duration === "yearly" ? "yearly premium plan" : undefined;
        break;

      default:
        throw new Error("Invalid plan name or duration");
    }

    if (!priceId || !priceName || !accountType) throw new BadRequestException("Invalid plan details provided");

    const subscription = await this.paystackClient.transaction.initialize({
      reference: crypto.randomBytes(10).toString("hex"),
      amount: 1000 * 100,
      email: user.email,
      callback_url: callback_url_success.toString(),
      metadata: {
        accountType,
        priceName,
      },
      plan: priceId,
    });

    if (!subscription.status) throw new BadRequestException("Subscription failed");

    return subscription.data;
  }

  async sendManagedPaystackSubscriptions(user: any) {
    if (!user.paystack_authorization_sub) throw new BadRequestException("User has no Paystack customer ID.");

    try {
      const response = await axios.get(`${this.baseUrl}/subscription/${user.paystack_authorization_sub}/manage/link`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      if (!response.data || !response.data.status) {
        throw new BadRequestException("Failed to fetch user subscriptions.");
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching Paystack subscriptions: ${JSON.stringify(error.response?.data || error.message)}`);

      if (error.response?.status === 404) {
        throw new NotFoundException("Customer or subscription not found.");
      }

      throw new InternalServerErrorException("An error occurred while fetching subscriptions.");
    }
  }
}
