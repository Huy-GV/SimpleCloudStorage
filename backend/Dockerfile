FROM node:21.7
EXPOSE 80
EXPOSE 5432

WORKDIR /app

COPY . .

RUN npm ci
RUN npm install -g dotenv-cli

RUN cd ./src/data/models; npx prisma generate

RUN npm run build

ENV NODE_ENV=production

CMD [ "node", "dist/main.js" ]
