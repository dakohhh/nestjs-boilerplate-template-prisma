import * as React from "react";
import { BaseTemplate } from "./base";
import { Text, Button } from "@react-email/components";

export interface WelcomeMailProps {
  name: string;
}

export const WelcomeMail = ({ name }: WelcomeMailProps) => (
  <BaseTemplate previewText="Welcome to NestJS BoilerPlate!">
    <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Welcome to NestJS BoilerPlate, {name}!</Text>
    <Text>We're excited to have you on board. NestJS BoilerPlate is here to make your freelance journey safer, smarter, and more rewarding.</Text>
    <Text>Get started by browsing projects or setting up your first contract.</Text>
    <Button href="#" style={{ backgroundColor: "#2B4BF2", padding: "12px 24px", borderRadius: "6px", color: "white", fontWeight: "bold", textDecoration: "none" }}>
      Go to Dashboard
    </Button>
  </BaseTemplate>
);
