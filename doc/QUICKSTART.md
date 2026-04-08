# Quick Start Guide

Get the app running in less than 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Docker Desktop installed and running
- ✅ Port 3000 and 3001 available

## Step 1: Get the Code

```bash
git clone <your-repo-url>
cd switchboard
```

## Step 2: Start Services

```bash
docker-compose up -d
```

Wait about 30-60 seconds for all services to initialize.

## Step 3: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

If you need to configure environment variables or database settings, see the `.env.example` files in each service folder.
