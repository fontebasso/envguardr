FROM node@sha256:32fa97f3363975684b08bf4e8a68a47c7905175cc20275b50b974bbd02aba731 AS builder
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
