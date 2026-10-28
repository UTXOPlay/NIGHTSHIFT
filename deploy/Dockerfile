FROM rust:1.97.1-bookworm AS native
RUN apt-get update && apt-get install -y --no-install-recommends clang libclang-dev pkg-config protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY games/nightshift-v8/native games/nightshift-v8/native
RUN cargo build --release --locked --manifest-path games/nightshift-v8/native/Cargo.toml --target-dir target

FROM node:22-bookworm-slim AS web
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && npm run check:release

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 zlib1g && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY --from=web /src/dist ./dist
COPY host ./host
COPY games/nightshift-v8/host.json ./games/nightshift-v8/host.json
COPY --from=native /src/target/release/myelin-nightshift-v8 ./target/release/myelin-nightshift-v8
RUN mkdir /app/data && chown node:node /app/data
USER node
ENV NODE_ENV=production BIND=0.0.0.0 WEB_PORT=8080 DATA_DIR=/app/data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "host/nightshift8.mjs"]
