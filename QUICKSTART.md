# 🚀 Quick Start Guide

## Step 1: Install Dependencies

```bash
npm run install-all
```

This installs dependencies for root, backend, and frontend.

## Step 2: Setup MySQL Database

1. Make sure MySQL is running on your system
2. Create the `.env` file in the `backend/` directory:

```bash
cd backend
cat > .env << EOF
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=abhayd95
DB_NAME=auctionhub
PORT=5000
EOF
cd ..
```

## Step 3: Seed the Database

```bash
npm run seed
```

This creates the database tables and adds 10 sample auctions.

## Step 4: Start the Application

```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:3000`

## Step 5: Access the Application

- **User Dashboard**: http://localhost:3000/dashboard
- **Admin Panel**: http://localhost:3000/admin

## 🐳 Docker Alternative

If you prefer Docker:

```bash
docker-compose up -d
```

Then access at `http://localhost:3000`

## ✅ Verify Cron Jobs

Check the server console logs. You should see:
- ✅ Cron jobs initialized messages
- 🧹 Cleanup messages every 30 minutes
- 📧 Hourly report messages
- 💾 Daily backup messages (at 2 AM)

You can also check cron logs in the Admin Panel!

