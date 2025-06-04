FROM node:20

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    ffmpeg \
    libsodium-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm pkg delete optionalDependencies

RUN npm install --legacy-peer-deps --no-audit

COPY . .

RUN npm run build

EXPOSE $PORT

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
