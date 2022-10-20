#syntax=docker/dockerfile:1
FROM node:12-alpine
WORKDIR /app
COPY ./package*.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]
EXPOSE 5001