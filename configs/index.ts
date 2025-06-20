/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ms from "ms";
import { config } from "dotenv";
import packageInfo from "../package.json";

config();

// How to use this:
// ============================================================
// This file is used to store all the environment variables and constants used in the application.

// # To add a new variable:
// ============================================================
// - For environment variables & constants that are the same across all environments, add them to the GLOBAL_CONSTANTS object.
// - For environment-specific variables (i.e they change depending on the environment), add them to the environment's object in each of the CONFIG_BUILDER object.

// # To add a new environment:
// ============================================================
// 1. Add a new key to the CONFIG_BUILDER object with the environment name.
// 2. Duplicate the development object and replace the values with the new environment's values.

const APP_VERSION = packageInfo.version;
const DEPLOYMENT_ENV = process.env.NODE_ENV || "development";

const GLOBAL_CONSTANTS = {
  // System Constants
  // ============================================================
  APP_NAME: "NestJS Boilerplate",
  APP_DESCRIPTION: "NestJS Boilerplate",
  SUPPORT_EMAIL: "support@nestjsboilerplate.com",
  DEFAULT_EMAIL_FROM: "NestJS Boilerplate <no-reply@nestjsboilerplate.com>",

  // Server Constants
  // ============================================================
  SERVER_BACKEND_TEAM_EMAILS: [], // TODO: Add alerts notification emails here

  // Security / Auth Configs
  // ============================================================
  BCRYPT_SALT: 10,
  JWT_ALGORITHM: "HS256",
  ACCESS_TOKEN_JWT_EXPIRES_IN: ms("1h"),
  REFRESH_TOKEN_JWT_EXPIRES_IN: ms("30d"),
  ROTATE_REFRESH_TOKENS: true,

  // Sentry & Monitoring Configs
  // ============================================================
  SENTRY: {
    RELEASE: APP_VERSION,
    DSN: "https://examplePublicKey@o0.ingest.sentry.io/0",
  },

  // App Level Configs
  // ============================================================

  AWS: {
    S3_BUCKET: process.env.AWS_S3_BUCKET_NAME,
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

    AWS_CLOUDFRONT_KEY_PAIR_ID: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID,
    AWS_CLOUDFRONT_PRIVATE_KEY: process.env.AWS_CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    AWS_CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME: process.env.AWS_CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME,
  },

  FACEBOOK: {
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
    FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,
  },

  USE_EMAIL_QUEUE: process.env.USE_EMAIL_QUEUE === "true" ? true : false,
};

const CONFIG_BUILDER = {
  development: {
    ...GLOBAL_CONSTANTS,

    // System Constants
    // ============================================================
    URL: {
      API_BASE_URL: "https://localhost:4000",
      AUTH_BASE_URL: "https://localhost:3000",
      LANDING_BASE_URL: "https://localhost:3000",
    },

    // Security / Auth Configs
    // ============================================================
    JWT_SECRET: "T4u2Rcnne09F.FBr11f0VvERyUiq",

    // DB Constants
    // ============================================================
    REDIS_URI: "redis://127.0.0.1:6379",

    // Mailer Configs
    // ============================================================
    MAILER: {
      SMTP_HOST: "localhost",
      SMTP_PORT: 2525,
      SMTP_USER: "user",
      SMTP_PASSWORD: "pass",
      SECURE: false,
      FROM_EMAIL: "NestJS Boilerplate <no-reply@nestjsboilerplate.com>",
    },

    // App Level Configs
    // ============================================================
    CORS_ALLOWED_ORIGINS: ["https://admin.socket.io", "http://localhost:3000"],

    SOCKET_IO: {
      USERNAME: "admin",
      PASSWORD: "password",
      MODE: "development" as "development" | "production",
    },

    SWAGGER: {
      PATH: "/docs",
      PASSWORD: "password",
    },

    PAYSTACK: {
      BASE_URL: "https://api.paystack.co",
      SECRET_KEY: "sk_test_a28b292b663f5e3e9af39a5ed97b3189520096e2",
    },

    SUPPORT: {
      URL: "",
    },
  },

  production: {
    ...GLOBAL_CONSTANTS,

    // System Constants
    // ============================================================
    URL: {
      AUTH_BASE_URL: "https://eatnvibe.com",
      LANDING_BASE_URL: "https://eatnvibe.com",
      API_BASE_URL: "https://api.eatnvibe.com",
    },

    // Security / Auth Configs
    // ============================================================
    JWT_SECRET: process.env.JWT_SECRET!,

    // DB Constants
    // ============================================================
    REDIS_URI: process.env.REDIS_URI!,

    // Mailer Configs
    // ============================================================
    MAILER: {
      SMTP_HOST: process.env.MAILER_SMTP_HOST,
      SMTP_PORT: process.env.MAILER_SMTP_PORT,
      SMTP_USER: process.env.MAILER_SMTP_USER,
      SMTP_PASSWORD: process.env.MAILER_SMTP_PASSWORD,
      SECURE: process.env.MAILER_SECURE === "true" ? true : false,
      USE_AWS_SES: process.env.MAILER_USE_AWS_SES === "true" ? true : false,
      FROM_EMAIL: "NestJS Boilerplate <no-reply@nestjsboilerplate.com>",
    },

    // App Level Configs
    // ============================================================
    CORS_ALLOWED_ORIGINS: ["https://admin.socket.io", "https://nestjsboilerplate.com"],

    SOCKET_IO: {
      USERNAME: process.env.SOCKET_IO_USERNAME!,
      PASSWORD: process.env.SOCKET_IO_PASSWORD!,
      MODE: process.env.SOCKET_IO_MODE! as "development" | "production",
    },

    SWAGGER: {
      PATH: "/docs",
      PASSWORD: process.env.SWAGGER_PASSWORD!,
    },
    PAYSTACK: {
      BASE_URL: process.env.PAYSTACK_BASE_URL || "https://api.paystack.co",
      SECRET_KEY: process.env.PAYSTACK_SECRET_KEY!,
    },

    SUPPORT: {
      URL: "",
    },
  },
} as const;

// Check if DEPLOYMENT_ENV is valid
if (!Object.keys(CONFIG_BUILDER).includes(DEPLOYMENT_ENV)) {
  throw new Error(`Invalid NODE_ENV: ${DEPLOYMENT_ENV}`);
}

const CONFIGS = CONFIG_BUILDER[DEPLOYMENT_ENV as keyof typeof CONFIG_BUILDER];

// Uncomment below to check configs set
// console.log("CONFIGS:", CONFIGS);

export { DEPLOYMENT_ENV, APP_VERSION, CONFIGS };

export default () => ({ DEPLOYMENT_ENV, APP_VERSION, CONFIGS });
