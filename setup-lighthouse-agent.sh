#!/bin/bash

set -e

REPO_URL="https://github.com/kumavolt/lighthouse-agent"
APP_DIR="/opt/lighthouse-agent"

echo "🚀 Cloning Lighthouse Agent..."
git clone $REPO_URL $APP_DIR

cd $APP_DIR/agent

echo "📦 Installing system dependencies..."
apt update && apt install -y curl git nodejs npm

echo "📦 Installing Node.js dependencies..."
npm install
npm install -g lighthouse pm2

echo "🔁 Starting with PM2..."
pm2 start index.js --name lighthouse-agent
pm2 save
pm2 startup

echo "✅ Done! Lighthouse Agent is running on port 3000"