FROM node:lts-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the code
COPY *.js ./
COPY errors ./errors
COPY maps ./maps
COPY models ./models
COPY scripts ./scripts
COPY smashers ./smashers
COPY static ./static

# Expose the port
EXPOSE 13028

# Start the server
CMD ["node", "."]
