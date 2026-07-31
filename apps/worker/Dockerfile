FROM node:22-alpine

RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter worker build

CMD ["pnpm", "--filter", "worker", "start"]
