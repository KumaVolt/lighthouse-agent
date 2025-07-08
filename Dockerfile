FROM node:18-slim

# Install Chromium and Lighthouse CLI
RUN apt-get update && apt-get install -y \
  chromium \
  curl \
  && npm install -g lighthouse \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy everything inside agent folder
COPY agent/ /app/

# Install dependencies from the correct package.json
RUN npm install

EXPOSE 3000

CMD ["node", "index.js"]
