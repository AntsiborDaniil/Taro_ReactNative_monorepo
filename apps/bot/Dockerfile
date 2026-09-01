# Timeweb: build context = apps/bot, Dockerfile path = apps/bot/Dockerfile
# Env in panel: TELEGRAM_BOT_TOKEN, WEB_APP_URL

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

CMD ["node", "dist/index.js"]
