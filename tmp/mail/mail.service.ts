import * as path from "path";
import * as fs from "fs/promises";
import { ConfigService } from "@nestjs/config";
import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  private readonly templatesDir: string;
  private logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) {
    this.templatesDir = path.join(process.cwd(), "src", "mail", "templates", "html", "v1");
  }

  private async getTemplate(name: string): Promise<string> {
    const filePath = path.join(this.templatesDir, `${name}.html`);
    return fs.readFile(filePath, "utf-8");
  }

  private async replaceTemplateVariables(template: string, variables: Record<string, string>): Promise<string> {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      // Escape the curly braces in the regex pattern
      result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), value);
    }
    return result;
  }

  async sendEmailVerificationEmail(email: string, verificationOTP: string) {
    const template = await this.getTemplate("verificationOtp");
    const html = await this.replaceTemplateVariables(template, {
      otp: verificationOTP,
    });

    await this.mailerService.sendMail({
      from: this.configService.get("CONFIGS.MAILER.FROM_EMAIL"),
      to: email,
      subject: "Verify your email address",
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetOTP: string) {
    const template = await this.getTemplate("passwordResetOtp");
    const html = await this.replaceTemplateVariables(template, {
      otp: resetOTP,
    });

    await this.mailerService.sendMail({
      from: this.configService.get("CONFIGS.MAILER.FROM_EMAIL"),
      to: email,
      subject: "Reset your password",
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    const template = await this.getTemplate("welcome");
    const html = await this.replaceTemplateVariables(template, {
      name: name,
    });

    await this.mailerService.sendMail({
      from: this.configService.get("CONFIGS.MAILER.FROM_EMAIL"),
      to: email,
      subject: "Welcome to NestJS BoilerPlate!",
      html,
    });
  }
}
