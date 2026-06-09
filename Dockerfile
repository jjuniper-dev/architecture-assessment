FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8090 DB_PATH=/app/data/assessment.sqlite
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/migrations ./server/migrations
RUN mkdir -p /app/data
EXPOSE 8090
CMD ["npm", "start"]
