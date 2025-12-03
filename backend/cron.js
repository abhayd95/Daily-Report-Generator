import cron from 'node-cron';
import pool from './db.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backups directory exists
const backupsDir = path.join(__dirname, '../backups');
fs.ensureDirSync(backupsDir);

// Log cron job execution
async function logCronJob(jobName, status, message) {
  try {
    await pool.execute(
      'INSERT INTO cron_logs (job_name, status, message) VALUES (?, ?, ?)',
      [jobName, status, message]
    );
  } catch (error) {
    console.error(`Error logging cron job ${jobName}:`, error);
  }
}

// Cleanup expired auctions (every 30 minutes)
cron.schedule('*/30 * * * *', async () => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM auctionhub_auctions WHERE end_time < NOW()'
    );
    const deletedCount = result.affectedRows;
    const message = `Deleted ${deletedCount} expired auction(s)`;
    console.log(`🧹 Auto cleanup done! ${message}`);
    await logCronJob('cleanup_expired', 'success', message);
  } catch (error) {
    console.error('❌ Cleanup cron job error:', error);
    await logCronJob('cleanup_expired', 'error', error.message);
  }
});

// Generate hourly report (every hour)
cron.schedule('0 * * * *', async () => {
  try {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM auctionhub_auctions WHERE end_time > NOW()'
    );
    const totalActive = rows[0].total;
    
    const report = {
      timestamp: new Date().toISOString(),
      totalActiveAuctions: totalActive,
      message: `Hourly Report: ${totalActive} active auction(s)`
    };

    // Simulate email sending
    console.log(`📧 Email Report Sent: ${report.message}`);
    console.log(JSON.stringify(report, null, 2));
    
    await logCronJob('hourly_report', 'success', report.message);
  } catch (error) {
    console.error('❌ Hourly report cron job error:', error);
    await logCronJob('hourly_report', 'error', error.message);
  }
});

// Daily database backup (2 AM)
cron.schedule('0 2 * * *', async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupsDir, `backup-${timestamp}.json`);
    
    // Get all auctions
    const [auctions] = await pool.execute('SELECT * FROM auctionhub_auctions');
    
    // Get cron logs
    const [cronLogs] = await pool.execute('SELECT * FROM cron_logs ORDER BY executed_at DESC LIMIT 100');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      backupType: 'automatic',
      auctions: auctions,
      cronLogs: cronLogs,
      totalAuctions: auctions.length,
      totalCronLogs: cronLogs.length
    };

    await fs.writeJSON(backupFile, backupData, { spaces: 2 });
    
    const message = `Backup created: ${backupFile}`;
    console.log(`💾 Daily backup done! ${message}`);
    await logCronJob('daily_backup', 'success', message);
  } catch (error) {
    console.error('❌ Daily backup cron job error:', error);
    await logCronJob('daily_backup', 'error', error.message);
  }
});

console.log('✅ Cron jobs initialized:');
console.log('  - Cleanup expired auctions: Every 30 minutes');
console.log('  - Hourly report: Every hour');
console.log('  - Daily backup: 2:00 AM');

