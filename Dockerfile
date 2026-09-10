FROM node@sha256:e961046fec20896e8904f2b4a8b4c7e5ca91826d84d8d33d83dbaa61f942069e AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build \
    && npm prune --omit=dev \
    && node dist/bin/cli.js --help

FROM gcr.io/distroless/nodejs24-debian13@sha256:2768f33c39e8781c17c9ab9b95c219978774795ac0a68ad7c8392dde89407e91
COPY --from=builder /app/dist /dist
COPY --from=builder /app/node_modules /node_modules
COPY --from=builder /app/package.json /package.json
WORKDIR /app
ENTRYPOINT ["/nodejs/bin/node", "/dist/bin/cli.js"]
CMD ["--help"]
