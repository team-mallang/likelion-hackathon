FROM node:22-alpine

RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter web build

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
