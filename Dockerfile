FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

RUN chmod +x infra/docker-entrypoint.sh

CMD ["./infra/docker-entrypoint.sh"]