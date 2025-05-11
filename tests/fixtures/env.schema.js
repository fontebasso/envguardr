import { validators } from "valitype";

export default {
  API_URL: {
    type: "url",
    required: true,
  },
  NODE_ENV: {
    type: { enum: ["development", "staging", "production"] },
    default: "development",
  },
  PORT: {
    type: "number",
    default: 3000,
  },
  DEBUG: {
    type: "boolean",
    default: false,
  },
  VERSION: {
    type: "string",
    required: true,
  },
  API_KEY: {
    type: "custom",
    validator: validators.regex(
      /^[A-Za-z0-9]{32}$/,
      "API_KEY must be a 32-character alphanumeric string",
    ),
  },
  AWS_S3_BUCKET: {
    type: "custom",
    validator: validators.awsArn("s3", "Must be a valid S3 bucket ARN"),
    required: true,
  },
};
