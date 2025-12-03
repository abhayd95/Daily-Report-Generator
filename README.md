# 🛒 AuctionHub - Cron Demo

A complete Node.js + MySQL e-commerce auction dashboard with automated cron jobs for cleanup, reporting, and backups.

## 🚀 Features

- **User Dashboard**: View active auctions with real-time countdown timers
- **Admin Panel**: Manage all auctions, view cron logs, manual cleanup
- **Automated Cron Jobs**:
  - 🧹 **Every 30 minutes**: Auto-delete expired auctions
  - 📧 **Every hour**: Generate and log hourly reports
  - 💾 **Daily 2 AM**: Database backup to `/backups` folder

## 📋 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: MySQL
- **Cron**: node-cron
- **Deployment**: Docker + Docker Compose

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone and install dependencies**:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

2. **Set up MySQL database**:
   - Create a MySQL database named `auctionhub`
   - Update `backend/.env` with your MySQL credentials:
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=abhayd95
   DB_NAME=auctionhub
   PORT=5000
   ```

3. **Seed the database**:
```bash
cd backend
node seed.js
```

4. **Start the application**:
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

This will:
- Start MySQL container
- Build and start backend container
- Build and start frontend container

Access the application at `http://localhost:3000`

### Manual Docker Build

```bash
docker build -t auctionhub .
docker run -p 3000:3000 -p 5000:5000 auctionhub
```

## 📁 Project Structure

```
auctionhub-crondemo/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Admin.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── backend/               # Express backend
│   ├── server.js         # Main server file
│   ├── cron.js          # Cron job definitions
│   ├── db.js            # Database connection
│   ├── seed.js          # Database seeding script
│   └── package.json
├── backups/              # Database backups (auto-created)
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🔌 API Endpoints

- `GET /api/health` - Health check
- `GET /api/auctions` - Get active auctions (user)
- `GET /api/auctions/all` - Get all auctions (admin)
- `POST /api/auctions` - Create new auction
- `DELETE /api/auctions/:id` - Delete auction (admin)
- `POST /api/cleanup` - Manual cleanup expired auctions
- `GET /api/cron-logs` - Get cron job execution logs

## ⏰ Cron Jobs

All cron jobs are defined in `backend/cron.js`:

1. **Cleanup Expired Auctions** (`*/30 * * * *`)
   - Runs every 30 minutes
   - Deletes auctions where `end_time < NOW()`

2. **Hourly Report** (`0 * * * *`)
   - Runs at the start of every hour
   - Generates report with total active auctions
   - Logs to database

3. **Daily Backup** (`0 2 * * *`)
   - Runs daily at 2:00 AM
   - Creates JSON backup in `/backups` folder

## 🎨 Frontend Pages

- **`/dashboard`** - User dashboard with active auctions and countdown timers
- **`/admin`** - Admin panel with all auctions, cron logs, and manual cleanup

## 🔧 Configuration

Update environment variables in `backend/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=abhayd95
DB_NAME=auctionhub
PORT=5000
```

## 📊 Database Schema

```sql
CREATE TABLE auctions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  starting_price DECIMAL(10,2) NOT NULL,
  bids_count INT DEFAULT 0,
  end_time DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cron_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚢 Coolify Deployment

This project is ready for Coolify deployment:

1. Connect your repository to Coolify
2. Set environment variables in Coolify dashboard
3. Deploy using Docker Compose or Dockerfile

## 📝 Notes

- Cron jobs start automatically when the backend server starts
- Backups are stored in the `/backups` directory
- All cron executions are logged to the `cron_logs` table
- The frontend auto-refreshes auction data every 10 seconds

## 🐛 Troubleshooting

- **Database connection errors**: Verify MySQL is running and credentials are correct
- **Cron jobs not running**: Check server logs for initialization messages
- **Port conflicts**: Update ports in `.env` and `docker-compose.yml`

## 📄 License

ISC

---

**Built with ❤️ for portfolio demonstration**

