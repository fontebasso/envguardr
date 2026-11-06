FROM node@sha256:438603bbb5cda404b9416f0b5c8026f61501ab911760d861ec28c36b5d675725 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build \
    && npm prune --omit=dev \
    && node dist/bin/cli.js --help

FROM gcr.io/distroless/nodejs24-debian13@sha256:03980f6fd2a3245fa06e371c36fd33528ebbc676a1d0f84e3e21d95cd291b807
COPY --from=builder /app/dist /dist
COPY --from=builder /app/node_modules /node_modules
COPY --from=builder /app/package.json /package.json
WORKDIR /app
# distroless "nonroot" user
USER 65532:65532
ENTRYPOINT ["/nodejs/bin/node", "/dist/bin/cli.js"]
CMD ["--help"]
