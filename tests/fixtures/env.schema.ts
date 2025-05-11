import { validators } from "../../../valitype/src/index.js";

export default {
  // Basic types
  API_URL: { type: "url", required: true },
  NODE_ENV: {
    type: { enum: ["development", "production", "test"] },
    default: "development",
  },
  PORT: { type: "number", default: 3000 },
  DEBUG: { type: "boolean", default: false },
  VERSION: { type: "string", required: true },

  // Custom validators
  API_KEY: {
    type: "custom",
    validator: validators.regex(
      /^[A-Za-z0-9]{32}$/,
      "API_KEY must be a 32-character alphanumeric string",
    ),
    required: true,
  },

  CACHE_TTL: {
    type: "custom",
    validator: validators.range(
      0,
      86400,
      "Cache TTL must be between 0 and 86400 seconds",
    ),
    default: "3600",
  },

  AWS_S3_BUCKET: {
    type: "custom",
    validator: validators.awsArn("s3", "Must be a valid S3 bucket ARN"),
    required: false,
  },

  CONFIG_JSON: {
    type: "custom",
    validator: validators.json("CONFIG_JSON must be valid JSON"),
    required: false,
  },

  RELEASE_DATE: {
    type: "custom",
    validator: validators.date(
      "YYYY-MM-DD",
      "Release date must be a valid date in YYYY-MM-DD format",
    ),
    required: false,
  },
};
