# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
RUN pnpm --filter @scheduler/shared build
RUN pnpm --filter @scheduler/backend build

FROM deps AS dev
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
EXPOSE 3000
CMD ["pnpm", "--filter", "@scheduler/backend", "dev"]

FROM builder AS runner
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]
