import { Queue } from "bull";
import { InjectQueue } from "@nestjs/bull";
import { MailQueue } from "./mail.processor";
import { render } from "@react-email/render";
import { ConfigService } from "@nestjs/config";
import { Injectable, Logger } from "@nestjs/common";
import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";
import { WelcomeMail, WelcomeMailProps } from "./templates/v1/welcome";
import { PasswordResetOtp, PasswordResetOtpProps } from "./templates/v1/passwordResetOtp";
import { VerificationOtp, VerificationOtpProps } from "./templates/v1/verificationOtp";

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    @InjectQueue(MailQueue.name) private readonly mailQueue: Queue
  ) {}

  async sendEmail<T extends Record<string, any>>(email: string, subject: string, templateFn: (props: T) => React.ReactElement, props: T) {
    const options: ISendMailOptions = {
      to: email,
      subject: subject,
    };

    if (this.configService.get("CONFIGS.USE_EMAIL_QUEUE")) {
      await this.mailQueue.add("sendEmail", {
        options,
        template: templateFn(props),
      });
    } else {
      const html = await render(templateFn(props), {
        plainText: true,
      });

      options.html = html;

      await this.mailerService.sendMail(options);
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    await this.sendEmail<WelcomeMailProps>(email, "Welcome to NestJS Boilerplate", WelcomeMail, { name });
  }

  async sendPasswordResetEmail(email: string, resetOTP: string) {
    await this.sendEmail<PasswordResetOtpProps>(email, "Reset your password", PasswordResetOtp, { otp: resetOTP });
  }

  async sendEmailVerificationEmail(email: string, verificationOTP: string) {
    await this.sendEmail<VerificationOtpProps>(email, "Verify your email", VerificationOtp, { otp: verificationOTP });
  }
}
