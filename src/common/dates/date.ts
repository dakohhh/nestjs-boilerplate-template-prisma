import moment from "moment";

interface BillingAnchor {
  plan_duration: string;
}

export const setBillingAnchor = (plan_duration: BillingAnchor["plan_duration"]): number => {
  let billingCycleAnchor: number;

  if (plan_duration === "monthly") {
    billingCycleAnchor = moment().utc().add(1, "month").startOf("month").subtract(1, "day").unix();
  } else if (plan_duration === "yearly") {
    billingCycleAnchor = moment().utc().add(1, "year").startOf("year").subtract(1, "day").unix();
  } else {
    throw new Error("Invalid plan duration");
  }

  return billingCycleAnchor;
};
