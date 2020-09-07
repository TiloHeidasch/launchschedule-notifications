# --------------------------
# | Build target           |
# --------------------------
FROM node:12.16.1-alpine

WORKDIR /home/launchschedule-notifications

COPY package*.json ./
RUN npm install

COPY tsconfig.json nest-cli.json ./
COPY src ./src

RUN npm run build && \
    npm prune --production

# --------------------------
# | Production target      |
# --------------------------
FROM node:12.16.1-alpine
EXPOSE 80

WORKDIR /home/launchschedule-notifications

COPY --from=0 /home/launchschedule-notifications/node_modules ./node_modules
COPY --from=0 /home/launchschedule-notifications/dist ./dist

CMD node dist/main.js
