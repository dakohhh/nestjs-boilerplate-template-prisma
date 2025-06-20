import { DEPLOYMENT_ENV, CONFIGS } from "../configs";

import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: CONFIGS.SENTRY.DSN,
  environment: DEPLOYMENT_ENV,
  release: CONFIGS.SENTRY.RELEASE,

  integrations: [
    // enable profiling
    nodeProfilingIntegration(),
  ],

  tracesSampleRate: 0.4, // % of transactions that will be sampled
  profilesSampleRate: 0.4, // % of transactions that will be profiled
});
