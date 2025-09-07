# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install required system packages for checkpointing
RUN apk add --no-cache \
    tar \
    gzip \
    bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --production

# Copy application code
COPY server.js ./

# Create necessary directories
RUN mkdir -p /app/data /app/backups

# Expose the application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]
