FROM node:lts-alpine

# install python and make
RUN apk update || : && \
	apk add python3 gcc make

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENTRYPOINT [ "node", "index.js" ]
