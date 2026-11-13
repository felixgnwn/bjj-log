# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# Stage 1: install everything and compile TypeScript
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Stage 2: production dependencies only (no TypeScript, Vitest, tsx, ...)
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 3: the image that actually runs
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# package.json is needed at runtime: it contains "type": "module"
COPY package.json ./

# Don't run as root
USER node

EXPOSE 3000

# Alpine has no curl, so use Node's built-in fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/api/server.js"]