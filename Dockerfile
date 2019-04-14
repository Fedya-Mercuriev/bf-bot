FROM node:10.15-slim

MAINTAINER Gleb Gorkoltsev <gleb.gorkoltsev@yandex.ru>

RUN mkdir /botdir
WORKDIR /botdir
COPY . /botdir

EXPOSE 443/tcp 8080/tcp

RUN npm install

ENTRYPOINT ["node", "core.js"]