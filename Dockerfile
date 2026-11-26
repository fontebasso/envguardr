FROM node@sha256:f8e5d4bb28fa55c74f1345166a082a10b7c68f22304350c1ce0d18358ae94996 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build \
    && npm prune --omit=dev \
    && node dist/bin/cli.js --help

FROM gcr.io/distroless/nodejs24-debian13@sha256:235cae47d37e0ba4ab70a723ed0bfd4f619c04d16d4226371d5d0c71a52f9211
COPY --from=builder /app/dist /dist
COPY --from=builder /app/node_modules /node_modules
COPY --from=builder /app/package.json /package.json
WORKDIR /app
# distroless "nonroot" user
USER 65532:65532
ENTRYPOINT ["/nodejs/bin/node", "/dist/bin/cli.js"]
CMD ["--help"]
