import * as React from "react";
import { BaseTemplate } from "./base";
import { Text } from "@react-email/components";

export interface VerificationOtpProps {
  otp: string;
}

export const VerificationOtp = ({ otp }: VerificationOtpProps) => (
  <BaseTemplate previewText="Verify your email with NestJS BoilerPlate">
    <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Verify Your Email</Text>
    <Text>Use the following code to verify your email on NestJS BoilerPlate:</Text>
    <Text style={{ fontSize: "24px", fontWeight: "bold", letterSpacing: "2px" }}>{otp}</Text>
  </BaseTemplate>
);
