import * as React from "react";
import { BaseTemplate } from "./base";
import { Text, Button, Section } from "@react-email/components";

export interface ProjectInviteProps {
  name: string;
  title: string;
  client: string;
  duration: string;
  totalBudget: string;
}

export const ProjectInvite = ({ name, title, client, duration, totalBudget }: ProjectInviteProps) => {
  return (
    <BaseTemplate previewText="You're invited to a new project via NestJS BoilerPlate">
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Hi {name}, Wisdom is inviting you to collaborate on a new project via NestJS BoilerPlate.</Text>
      <Section>
        <ul style={{ paddingLeft: "20px" }}>
          <li>Title: {title}</li>
          <li>Client: {client}</li>
          <li>Duration: {duration}</li>
          <li>Total Budget: {totalBudget}</li>
          <li>Payment Plan: Per Milestones</li>
          <li>No of Milestones: Five (5)</li>
        </ul>
        <Button href="#" style={{ backgroundColor: "#2B4BF2", padding: "12px 24px", borderRadius: "6px", color: "white", fontWeight: "bold", textDecoration: "none" }}>
          View Contract Details
        </Button>
      </Section>
      <Text style={{ fontSize: "16px", fontWeight: "bold", marginTop: "32px" }}>What's Next</Text>
      <Section style={{ backgroundColor: "#f2f3f5", padding: "20px", borderRadius: "6px" }}>
        <Text>
          <strong>Sign In or Sign Up</strong>
        </Text>
        <Text>
          <a href="#" style={{ color: "#2B4BF2" }}>
            View contract
          </a>{" "}
          details by logging into your NestJS BoilerPlate account. If you're new, you'll need to sign up.
        </Text>
        <Text>
          <strong>Review & Sign the Contract</strong>
        </Text>
        <Text>Go through the project details carefully. Once aligned, upload your signature to formalize the agreement.</Text>
        <Text>
          <strong>Start the Project</strong>
        </Text>
        <Text>The contract has been funded by the client, so you're protected. With NestJS BoilerPlate escrow, payment is guaranteed and released per milestone. If issues arise, you can raise a dispute.</Text>
      </Section>
      <Text style={{ fontSize: "14px", marginTop: "32px" }}>
        Questions? Email us at{" "}
        <a href="mailto:help@NestJS BoilerPlate.com" style={{ color: "#2B4BF2" }}>
          Help@NestJS BoilerPlate.com
        </a>
      </Text>
    </BaseTemplate>
  );
};
