FROM node:latest

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm install

COPY src ./src
COPY test ./test
COPY bin ./bin

RUN npm test && npm start

ENTRYPOINT [ "/app/bin/cluster-cleanup" ]
