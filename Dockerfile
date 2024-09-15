FROM node:lts-slim

WORKDIR /app

# Copy the code
COPY package*.json ./
COPY *.js ./
COPY errors ./errors
COPY maps ./maps
COPY models ./models
COPY scripts ./scripts
COPY smashers ./smashers
COPY static ./static

# Install dependencies
RUN npm ci

# Expose the port
EXPOSE 13028

# Start the server
CMD ["node", "."]