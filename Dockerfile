FROM node:12

WORKDIR /app
COPY kainos-chain.pem .

RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
RUN mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
RUN apt update && \
    apt upgrade -y && \
    apt install apt-transport-https

RUN sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/debian/9/prod stretch main" > /etc/apt/sources.list.d/dotnetdev.list'
RUN apt update && \
    apt install azure-functions-core-tools-3

WORKDIR /app/ftts-scheduling-api
COPY ftts-scheduling-api/.npmrc .
COPY ftts-scheduling-api/packag*.json ./
RUN export NODE_EXTRA_CA_CERTS=/app/kainos-chain.pem && \
    npm install -g npm@7.9.0 && \
    npm install

COPY ftts-scheduling-api/ ./
COPY .env .

RUN rm *.js

ENTRYPOINT [ "npm", "run", "func:start" ]
