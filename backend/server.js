import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { initDatabase } from './db.js';
import './cron.js'; // Initialize cron jobs
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupsDir = path.join(__dirname, '../backups');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database on startup
initDatabase().catch(console.error);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AuctionHub API is running' });
});

// Get active auctions (user dashboard)
app.get('/api/auctions', async (req, res) => {
  try {
    const [auctions] = await pool.execute(
      'SELECT * FROM auctionhub_auctions WHERE end_time > NOW() ORDER BY end_time ASC'
    );
    res.json(auctions);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

// Get all auctions (admin panel)
app.get('/api/auctions/all', async (req, res) => {
  try {
    const [auctions] = await pool.execute(
      'SELECT * FROM auctionhub_auctions ORDER BY created_at DESC'
    );
    res.json(auctions);
  } catch (error) {
    console.error('Error fetching all auctions:', error);
    res.status(500).json({ error: 'Failed to fetch all auctions' });
  }
});

// Create new auction
app.post('/api/auctions', async (req, res) => {
  try {
    const { title, description, starting_price, end_time } = req.body;
    
    if (!title || !starting_price || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      'INSERT INTO auctionhub_auctions (title, description, starting_price, end_time) VALUES (?, ?, ?, ?)',
      [title, description || '', starting_price, end_time]
    );

    const [newAuction] = await pool.execute(
      'SELECT * FROM auctionhub_auctions WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newAuction[0]);
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ error: 'Failed to create auction' });
  }
});

// Delete auction (admin)
app.delete('/api/auctions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM auctionhub_auctions WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    res.json({ message: 'Auction deleted successfully' });
  } catch (error) {
    console.error('Error deleting auction:', error);
    res.status(500).json({ error: 'Failed to delete auction' });
  }
});

// Get cron logs (admin)
app.get('/api/cron-logs', async (req, res) => {
  try {
    const [logs] = await pool.execute(
      'SELECT * FROM cron_logs ORDER BY executed_at DESC LIMIT 50'
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching cron logs:', error);
    res.status(500).json({ error: 'Failed to fetch cron logs' });
  }
});

// Manual cleanup endpoint (admin)
app.post('/api/cleanup', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM auctionhub_auctions WHERE end_time < NOW()'
    );
    const deletedCount = result.affectedRows;
    res.json({ message: `Cleaned up ${deletedCount} expired auction(s)` });
  } catch (error) {
    console.error('Error in manual cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup expired auctions' });
  }
});

// Get all backups (admin)
app.get('/api/backups', async (req, res) => {
  try {
    fs.ensureDirSync(backupsDir);
    const files = await fs.readdir(backupsDir);
    const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
    
    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(backupsDir, file);
        const stats = await fs.stat(filePath);
        let backupData = null;
        
        try {
          backupData = await fs.readJSON(filePath);
        } catch (e) {
          console.error(`Error reading backup file ${file}:`, e);
        }
        
        return {
          filename: file,
          createdAt: stats.birthtime.toISOString(),
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2),
          totalAuctions: backupData?.totalAuctions || 0,
          totalCronLogs: backupData?.totalCronLogs || 0,
          backupType: backupData?.backupType || 'automatic'
        };
      })
    );
    
    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(backups);
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

// Get specific backup file content
app.get('/api/backups/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security: Only allow backup files
    if (!filename.startsWith('backup-') || !filename.endsWith('.json')) {
      return res.status(400).json({ error: 'Invalid backup filename' });
    }
    
    const filePath = path.join(backupsDir, filename);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    
    // Check if client wants to download the file
    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.sendFile(path.resolve(filePath));
    }
    
    const backupData = await fs.readJSON(filePath);
    res.json(backupData);
  } catch (error) {
    console.error('Error fetching backup content:', error);
    res.status(500).json({ error: 'Failed to fetch backup content' });
  }
});

// Create manual backup
app.post('/api/backups/create', async (req, res) => {
  try {
    fs.ensureDirSync(backupsDir);
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
    
    const stats = await fs.stat(backupFile);
    
    res.json({
      message: 'Backup created successfully',
      filename: path.basename(backupFile),
      createdAt: stats.birthtime.toISOString(),
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      totalAuctions: auctions.length,
      totalCronLogs: cronLogs.length
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Convert backup to PDF
app.get('/api/backups/:filename/pdf', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security check
    if (!filename.startsWith('backup-') || !filename.endsWith('.json')) {
      return res.status(400).json({ error: 'Invalid backup filename' });
    }
    
    const filePath = path.join(backupsDir, filename);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    
    const backupData = await fs.readJSON(filePath);
    const pdfFilename = filename.replace('.json', '.pdf');
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    
    // Header - Dark blue for title
    doc.fontSize(20)
       .fillColor('#1e40af')
       .text('AuctionHub Backup Report', { align: 'center' });
    doc.moveDown();
    
    // Metadata Section - Dark gray/black
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text(`Backup Date: ${new Date(backupData.timestamp).toLocaleString()}`, { align: 'left' })
       .text(`Type: ${backupData.backupType || 'automatic'}`, { align: 'left' })
       .text(`Total Auctions: ${backupData.totalAuctions || 0}`, { align: 'left' })
       .text(`Total Cron Logs: ${backupData.totalCronLogs || 0}`, { align: 'left' });
    doc.moveDown();
    
    // Auctions Section
    if (backupData.auctions && backupData.auctions.length > 0) {
      doc.fontSize(16)
         .fillColor('#1e40af')
         .text('Auctions', { underline: true });
      doc.moveDown(0.5);
      
      backupData.auctions.forEach((auction, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }
        
        doc.fontSize(11)
           .fillColor('#000000')
           .text(`${index + 1}. ${auction.title}`, { continued: false })
           .fillColor('#059669')
           .text(`   Price: $${parseFloat(auction.starting_price).toFixed(2)}`, { indent: 20 })
           .fillColor('#2563eb')
           .text(`   Bids: ${auction.bids_count}`, { indent: 20 })
           .fillColor('#4b5563')
           .text(`   End Time: ${new Date(auction.end_time).toLocaleString()}`, { indent: 20 });
        
        if (auction.description) {
          doc.fontSize(9)
             .fillColor('#6b7280')
             .text(`   Description: ${auction.description.substring(0, 100)}${auction.description.length > 100 ? '...' : ''}`, { indent: 20 });
        }
        
        doc.moveDown(0.4);
      });
    }
    
    // Cron Logs Section
    if (backupData.cronLogs && backupData.cronLogs.length > 0) {
      doc.addPage();
      doc.fontSize(16)
         .fillColor('#1e40af')
         .text('Cron Job Logs', { underline: true });
      doc.moveDown(0.5);
      
      backupData.cronLogs.slice(0, 50).forEach((log, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }
        
        const statusColor = log.status === 'success' ? '#059669' : '#dc2626';
        
        doc.fontSize(10)
           .fillColor('#000000')
           .text(`${index + 1}. ${log.job_name}`, { continued: false })
           .fillColor(statusColor)
           .text(`   Status: ${log.status}`, { indent: 20 })
           .fillColor('#4b5563')
           .text(`   Time: ${new Date(log.executed_at).toLocaleString()}`, { indent: 20 });
        
        if (log.message) {
          doc.fontSize(9)
             .fillColor('#6b7280')
             .text(`   Message: ${log.message}`, { indent: 20 });
        }
        
        doc.moveDown(0.3);
      });
    }
    
    // Footer - Medium gray
    doc.fontSize(8)
       .fillColor('#6b7280')
       .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
    
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

