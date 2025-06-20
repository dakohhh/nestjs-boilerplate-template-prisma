import * as React from "react";
import { BaseTemplate } from "./base";
import { Text } from "@react-email/components";

export interface PasswordResetOtpProps {
  otp: string;
}

export const PasswordResetOtp = ({ otp }: PasswordResetOtpProps) => (
  <BaseTemplate previewText="Reset your NestJS BoilerPlate password">
    <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Reset Your Password</Text>
    <Text>Use the code below to reset your NestJS BoilerPlate password:</Text>
    <Text style={{ fontSize: "24px", fontWeight: "bold", letterSpacing: "2px" }}>{otp}</Text>
  </BaseTemplate>
);
