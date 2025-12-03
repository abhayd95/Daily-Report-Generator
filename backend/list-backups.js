import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupsDir = path.join(__dirname, '../backups');

async function listBackups() {
  try {
    // Ensure directory exists
    fs.ensureDirSync(backupsDir);
    
    const files = await fs.readdir(backupsDir);
    const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
    
    if (backupFiles.length === 0) {
      console.log('📭 No backups found in backups/ directory');
      return;
    }
    
    console.log(`\n📦 Found ${backupFiles.length} backup(s):\n`);
    
    for (const file of backupFiles.sort().reverse()) {
      const filePath = path.join(backupsDir, file);
      const stats = await fs.stat(filePath);
      const backupData = await fs.readJSON(filePath);
      
      console.log(`📁 ${file}`);
      console.log(`   Created: ${new Date(stats.birthtime).toLocaleString()}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Auctions: ${backupData.totalAuctions || 0}`);
      console.log(`   Type: ${backupData.backupType || 'automatic'}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error listing backups:', error);
  }
}

listBackups();

