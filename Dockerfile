# Use the official Node.js 14 image as the base image
FROM node:21

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 3000