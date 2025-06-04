# Use Node.js 20 for better compatibility
FROM node:20

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    ffmpeg \
    libsodium-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Remove problematic optional dependencies
RUN npm pkg delete optionalDependencies

# Install dependencies
RUN npm install --legacy-peer-deps --no-audit

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE $PORT

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "start"]
