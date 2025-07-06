FROM node:18-slim

# Install Lighthouse CLI and Chromium dependencies
RUN apt-get update && apt-get install -y \
  chromium \
  curl \
  && npm install -g lighthouse \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY agent/package.json ./
RUN npm install

COPY agent .

EXPOSE 3000

CMD ["node", "index.js"]