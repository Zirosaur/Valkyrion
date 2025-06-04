FROM node:20-alpine

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    libsodium-dev \
    pkgconfig

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./

RUN npm install --legacy-peer-deps --no-audit --production=false

COPY . .

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
