import * as React from "react";
import { Html, Head, Preview, Body, Container } from "@react-email/components";

export const BaseTemplate = ({ previewText, children }: { previewText: string; children: React.ReactNode }) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "8px", margin: "40px auto", maxWidth: "600px" }}>{children}</Container>
      </Body>
    </Html>
  );
};
