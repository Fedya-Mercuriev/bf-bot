FROM node:latest

MAINTAINER Gleb Gorkoltzev <test@outlook.com>

RUN mkdir /botdir
WORKDIR /botdir
COPY . /botdir

RUN npm install

ENTRYPOINT ["node", "core.js"]