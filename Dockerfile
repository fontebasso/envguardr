FROM node@sha256:b46a10d964ad15136ebdf9012142131481caa0697d7a4d4eafe4bbabd818f876 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build \
    && npm prune --omit=dev \
    && node dist/bin/cli.js --help

FROM gcr.io/distroless/nodejs24-debian13@sha256:ed5e65a1036b505c9e5abf0d0412ce0f70be1b812630bbbbaf49ce47edc7a513
COPY --from=builder /app/dist /
COPY --from=builder /app/node_modules /node_modules
COPY --from=builder /app/package.json /package.json
WORKDIR /app
ENTRYPOINT ["/nodejs/bin/node", "/bin/cli.js"]
CMD ["--help"]
