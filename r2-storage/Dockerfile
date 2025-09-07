FROM node:18-alpine

WORKDIR /app

# Create the mount directories that will be used for R2 buckets
RUN mkdir -p /mnt/data /mnt/logs

# Simple package.json for the container app
COPY package.json ./
RUN npm install

# Copy the container application
COPY container-app.js ./

EXPOSE 8080

CMD ["node", "container-app.js"]
