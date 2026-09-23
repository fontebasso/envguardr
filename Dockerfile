FROM node@sha256:a723b54c35a76e947095a20a67d39585bb09c862e6b1adeb8a9f518f95e34fb0 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build \
    && npm prune --omit=dev \
    && node dist/bin/cli.js --help

FROM gcr.io/distroless/nodejs24-debian13@sha256:e7b49c7570331548957099e4c53d1b7255605dd20b0c56ee368077c07c1b170b
COPY --from=builder /app/dist /dist
COPY --from=builder /app/node_modules /node_modules
COPY --from=builder /app/package.json /package.json
WORKDIR /app
ENTRYPOINT ["/nodejs/bin/node", "/dist/bin/cli.js"]
CMD ["--help"]
