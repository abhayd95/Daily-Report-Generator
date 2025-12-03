import pool from './db.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupsDir = path.join(__dirname, '../backups');

// Ensure backups directory exists
fs.ensureDirSync(backupsDir);

async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupsDir, `backup-${timestamp}.json`);
    
    // Get all auctions
    const [auctions] = await pool.execute('SELECT * FROM auctionhub_auctions');
    
    // Get cron logs
    const [cronLogs] = await pool.execute('SELECT * FROM cron_logs ORDER BY executed_at DESC LIMIT 100');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      backupType: 'manual',
      auctions: auctions,
      cronLogs: cronLogs,
      totalAuctions: auctions.length,
      totalCronLogs: cronLogs.length
    };

    await fs.writeJSON(backupFile, backupData, { spaces: 2 });
    
    console.log('✅ Backup created successfully!');
    console.log(`📁 Location: ${backupFile}`);
    console.log(`📊 Auctions backed up: ${auctions.length}`);
    console.log(`📋 Cron logs backed up: ${cronLogs.length}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup error:', error);
    process.exit(1);
  }
}

createBackup();

