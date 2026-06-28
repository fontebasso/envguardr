FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM gcr.io/distroless/nodejs24-debian12
COPY --from=builder /app/dist /dist
COPY --from=builder /app/node_modules /dist/node_modules
COPY --from=builder /app/package.json /dist/package.json
WORKDIR /app
ENTRYPOINT ["/nodejs/bin/node", "/dist/bin/cli.js"]
