# 💾 Backup System Guide

## How Backups Work

### Automatic Backups
- **Schedule**: Daily at 2:00 AM
- **Location**: `/backups` directory
- **Format**: JSON files
- **Content**: All auctions and cron logs
- **Naming**: `backup-YYYY-MM-DDTHH-MM-SS-sssZ.json`

### What Gets Backed Up
1. **All Auctions**: Complete auction data from `auctionhub_auctions` table
2. **Cron Logs**: Last 100 cron job execution logs
3. **Metadata**: Timestamp, backup type, counts

---

## Manual Backup Commands

### Create a Backup Now
```bash
cd backend
node manual-backup.js
```

This will:
- Create a backup file in `/backups` directory
- Include all current auctions
- Include recent cron logs
- Show backup location and stats

### List All Backups
```bash
cd backend
node list-backups.js
```

This shows:
- All backup files
- Creation date
- File size
- Number of auctions backed up

---

## Backup File Structure

```json
{
  "timestamp": "2024-12-03T14:30:00.000Z",
  "backupType": "manual",
  "auctions": [
    {
      "id": 1,
      "title": "Vintage Rolex Watch",
      "description": "...",
      "starting_price": 5000.00,
      "bids_count": 19,
      "end_time": "2024-12-05T14:30:00.000Z",
      "created_at": "2024-12-03T12:30:00.000Z"
    }
  ],
  "cronLogs": [...],
  "totalAuctions": 10,
  "totalCronLogs": 50
}
```

---

## Restoring from Backup

### Option 1: Manual Restore (via code)
You can read a backup file and restore data:

```javascript
import fs from 'fs-extra';
import pool from './db.js';

const backupFile = './backups/backup-2024-12-03T14-30-00-000Z.json';
const backupData = await fs.readJSON(backupFile);

// Restore auctions
for (const auction of backupData.auctions) {
  await pool.execute(
    'INSERT INTO auctionhub_auctions (title, description, starting_price, bids_count, end_time) VALUES (?, ?, ?, ?, ?)',
    [auction.title, auction.description, auction.starting_price, auction.bids_count, auction.end_time]
  );
}
```

### Option 2: View Backup Contents
```bash
# View a specific backup
cat backups/backup-*.json | python3 -m json.tool
```

---

## Backup Location

All backups are stored in:
```
/backups/
  ├── backup-2024-12-03T02-00-00-000Z.json
  ├── backup-2024-12-04T02-00-00-000Z.json
  └── ...
```

---

## Cron Job Details

The automatic backup runs via cron job:
- **Schedule**: `0 2 * * *` (2:00 AM daily)
- **File**: `backend/cron.js`
- **Logs**: Stored in `cron_logs` table

You can check backup execution in:
- Server console logs
- Admin panel → Cron Logs section
- Database `cron_logs` table

---

## Tips

1. **Manual Backup Before Changes**: Always create a manual backup before making major changes
2. **Regular Cleanup**: Old backups can be deleted to save space
3. **Backup Verification**: Use `list-backups.js` to verify backups are being created
4. **Production**: For production, consider using `mysqldump` for full database backups

---

## Quick Commands

```bash
# Create backup
cd backend && node manual-backup.js

# List backups
cd backend && node list-backups.js

# View latest backup
ls -lt backups/ | head -2
cat backups/backup-*.json | tail -1 | python3 -m json.tool
```

