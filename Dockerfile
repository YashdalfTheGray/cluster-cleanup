FROM node:latest as builder

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./

RUN npm install

COPY src ./src
COPY test ./test

RUN npm test && npm start

FROM node:slim as runner

RUN mkdir /app
WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/dist ./dist
COPY ./bin ./bin

RUN npm install --only=production && npm prune --production

ENTRYPOINT [ "/app/bin/cluster-cleanup" ]
