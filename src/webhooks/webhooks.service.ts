// import { PaymentService } from "src/payments/payment.service";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger();
  private readonly paymentService: any;
  constructor() {}

  async StripeSubscriptionEvent(event: any) {
    const { id, customer } = event.object;

    await this.paymentService.addStripeSubscriptionId(customer, id);
  }

  async StripePaymentEventSuccessful(event: any) {
    const { id, currency, customer, hosted_invoice_url, lines, amount_due, status, period_start, period_end, subscription_details, attempt_count } = event.object;
    const lineItem = lines.data[0];
    const account_type = subscription_details?.metadata.accountType;
    const account_type_name = subscription_details?.metadata.accountPlanName;

    const paymentData = {
      payment_id: id,
      payment_status: status,
      payment_amount: amount_due / 100,
      payment_currency: currency,
      payment_description: lineItem.description,
      payment_receipt_url: hosted_invoice_url,
      payment_customer_id: customer,
      period_start: new Date(period_start * 1000),
      period_end: new Date(period_end * 1000),
      interval: lineItem.plan.interval,
    };

    await this.paymentService.createStripeInvoicePaymentSuccessful(paymentData, account_type, account_type_name, attempt_count);
  }

  async StripePaymentEventFailed(event: any) {
    const { customer, attempt_count, last_payment_error, status, hosted_invoice_url } = event.object;
    const errorMessage = last_payment_error?.message;

    if (status === "canceled" || status === "past_due") {
      await this.paymentService.updateCustomerSubscriptionStatus(customer, attempt_count);
    }

    if (status !== "canceled" && attempt_count > 1 && attempt_count < 5) {
      await this.paymentService.notifyCustomerToUpdatePaymentMethod(customer, errorMessage, hosted_invoice_url);
    }
  }

  async StripeSubscriptionDeleted(event: any) {
    const { id, customer } = event.object;
    await this.paymentService.removeStripeSubscriptionId(customer, id);
  }

  async PaystackSubscriptionEvent(event: any) {
    const { data } = event;
    const { customer, status, amount, reference, metadata } = data;
    const { accountType, priceName } = metadata || {};

    if (!customer.customer_code) throw new BadRequestException("Invalid subscription data received.");

    if (status === "success") {
      await this.paymentService.addPaystackSubscriptionType(data, customer.customer_code, accountType, priceName, amount, reference);
    }
  }

  async paystackUpdateSubscriptionEvent(event: any) {
    const { data } = event;
    const { customer, subscription_code, status, authorization } = data;

    if (!customer.customer_code || !subscription_code) throw new BadRequestException("Invalid subscription data received.");

    if (status === "active") {
      await this.paymentService.addPaystackSubscriptionId(customer.customer_code, subscription_code, authorization.authorization_code);
    }
  }

  async paystackCancelSubscriptionEvent(event: any) {
    const { data } = event;
    const { status, subscription_code } = data;
    if (status === "complete") {
      await this.paymentService.removePaystackSubscriptionId(subscription_code);
    }
  }

  async paystackSubscriptionNotRenewEvent(event: any) {
    const { data } = event;
    const { status, subscription_code } = data;
    if (status === "non-renewing") {
      await this.paymentService.sendPreAlertCancellationEmail(subscription_code);
    }
  }
}
