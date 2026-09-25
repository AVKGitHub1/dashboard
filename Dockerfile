# ---- stage 1: build the React SPA ----
# Pinned to the build host's platform: the Vite output is static, platform-independent
# JS/CSS, so building it under QEMU emulation for a cross-arch target image is wasted
# time (and has been known to hang) for zero benefit.
FROM --platform=$BUILDPLATFORM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ---- stage 2: server runtime ----
FROM node:20-alpine AS server
WORKDIR /app

RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/src ./src
COPY --from=client-build /app/client/dist ./public

ENV PORT=7070
ENV DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 7070

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT,path:'/api/health'},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/index.js"]
