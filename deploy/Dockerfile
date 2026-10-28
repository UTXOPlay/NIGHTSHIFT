FROM rust:1.97.1-bookworm AS native
RUN apt-get update && apt-get install -y --no-install-recommends clang libclang-dev pkg-config protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY games/nightshift-v8/native games/nightshift-v8/native
COPY games/nightshift-v9/native games/nightshift-v9/native
COPY games/arcade/web/nightshift9-courses.json games/arcade/web/nightshift9-courses.json
RUN cargo build --release --locked --manifest-path games/nightshift-v8/native/Cargo.toml --target-dir target && cargo build --release --locked --manifest-path games/nightshift-v9/native/Cargo.toml --target-dir target

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
COPY games/nightshift-v9/host.json ./games/nightshift-v9/host.json
COPY --from=native /src/target/release/myelin-nightshift-v8 ./target/release/myelin-nightshift-v8
COPY --from=native /src/target/release/myelin-nightshift-v9 ./target/release/myelin-nightshift-v9
RUN mkdir /app/data /app/data-v9 && chown node:node /app/data /app/data-v9
USER node
ENV NODE_ENV=production BIND=0.0.0.0 WEB_PORT=8080 DATA_DIR=/app/data-v9 LEGACY_DATA_DIR=/app/data RUNTIME_BINARY=/app/target/release/myelin-nightshift-v9 LEGACY_BINARY=/app/target/release/myelin-nightshift-v8
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "host/nightshift9.mjs"]
