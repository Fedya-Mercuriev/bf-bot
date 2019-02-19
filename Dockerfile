FROM mhart/alpine-node:latest

MAINTAINER Gleb Gorkoltsev <gleb.gorkoltsev@yandex.ru>

RUN mkdir /botdir
WORKDIR /botdir
COPY . /botdir

RUN npm install

EXPOSE 443/tcp
EXPOSE 8080/tcp

ENTRYPOINT ["node", "core.js"]