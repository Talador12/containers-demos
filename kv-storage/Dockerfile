FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY container-app.js .

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "container-app.js"]
