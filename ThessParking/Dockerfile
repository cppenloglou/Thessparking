FROM node:23-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install && npm install -g expo-cli

COPY . .

EXPOSE 8081
EXPOSE 19000
EXPOSE 19006

CMD [ "npx", "expo", "start" ]