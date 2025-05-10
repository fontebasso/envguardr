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
};
