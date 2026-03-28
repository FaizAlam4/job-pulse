#!/bin/bash

# 🚀 Job Intelligence Engine - Setup & First Run Script

echo "╔════════════════════════════════════════════╗"
echo "║   Job Intelligence Engine - Setup Script   ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Node.js check
echo -e "${YELLOW}Step 1: Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "  Install from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Step 3: Setup .env
echo -e "${YELLOW}Step 3: Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo "  Please edit .env with your configuration:"
    echo "  - MONGODB_URI"
    echo "  - SERPAPI_KEY (optional)"
    echo ""
    echo -e "${YELLOW}Edit .env now before starting (nano .env)${NC}"
    echo ""
    read -p "Press Enter after editing .env..."
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# Step 4: Check MongoDB
echo -e "${YELLOW}Step 4: Checking MongoDB...${NC}"
MONGODB_URI=$(grep "MONGODB_URI" .env | cut -d '=' -f2)
echo "  MongoDB URI: $MONGODB_URI"
echo ""
if [[ $MONGODB_URI == mongodb://localhost* ]]; then
    if ! command -v mongod &> /dev/null; then
        echo -e "${RED}✗ MongoDB not found (local)${NC}"
        echo "  Install from: https://www.mongodb.com/try/download/community"
        echo "  Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas"
        echo ""
        read -p "Make sure MongoDB is running before starting the server..."
    else
        echo -e "${GREEN}✓ MongoDB is installed${NC}"
    fi
else
    echo -e "${GREEN}✓ Using MongoDB Atlas (cloud)${NC}"
fi
echo ""

# Step 5: Ready to run
echo -e "${YELLOW}Step 5: Ready to start!${NC}"
echo ""
echo "Your options:"
echo ""
echo "  1. Development mode (auto-reload on file changes):"
echo "     npm run dev"
echo ""
echo "  2. Production mode:"
echo "     npm start"
echo ""
echo "  3. View documentation:"
echo "     - QUICKSTART.md  - 5-minute setup"
echo "     - README.md      - Complete guide"
echo "     - ARCHITECTURE.md - System design"
echo ""
echo -e "${GREEN}Setup complete! You're ready to go.${NC}"
echo ""
echo "🚀 Start the server with: npm run dev"
echo ""
