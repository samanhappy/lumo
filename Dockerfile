FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5173
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --chown=node:node server.js database.js auth.js ai.js index.html ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node scripts ./scripts
RUN mkdir data && chown node:node data
USER node
EXPOSE 5173
CMD ["node", "server.js"]
