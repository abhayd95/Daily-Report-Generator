import pool, { initDatabase } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  try {
    await initDatabase();

    // Clear existing auctions
    await pool.execute('DELETE FROM auctionhub_auctions');

    // Create 10 sample auctions with various end times
    const now = new Date();
    const auctions = [
      {
        title: 'Vintage Rolex Watch',
        description: 'Classic timepiece in excellent condition',
        starting_price: 5000.00,
        end_time: new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
      },
      {
        title: 'Rare Comic Book Collection',
        description: 'First edition Marvel comics from 1960s',
        starting_price: 1200.00,
        end_time: new Date(now.getTime() + 5 * 60 * 60 * 1000) // 5 hours from now
      },
      {
        title: 'Antique Persian Rug',
        description: 'Handwoven silk rug, 200 years old',
        starting_price: 3500.00,
        end_time: new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 hours from now
      },
      {
        title: 'Limited Edition Sneakers',
        description: 'Nike Air Jordan 1 Retro High OG',
        starting_price: 800.00,
        end_time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
      },
      {
        title: 'Vintage Vinyl Records',
        description: 'Collection of 50 classic albums',
        starting_price: 450.00,
        end_time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      },
      {
        title: 'Designer Handbag',
        description: 'Hermès Birkin bag, authentic',
        starting_price: 15000.00,
        end_time: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000) // 6 days from now
      },
      {
        title: 'Collectible Action Figures',
        description: 'Star Wars original trilogy figures',
        starting_price: 600.00,
        end_time: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      },
      {
        title: 'Art Deco Lamp',
        description: '1920s Tiffany-style lamp',
        starting_price: 1200.00,
        end_time: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
      },
      {
        title: 'Vintage Camera Collection',
        description: 'Leica and Hasselblad cameras',
        starting_price: 2800.00,
        end_time: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        title: 'Rare Wine Collection',
        description: 'Bordeaux wines from 1980s',
        starting_price: 5000.00,
        end_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      }
    ];

    for (const auction of auctions) {
      await pool.execute(
        'INSERT INTO auctionhub_auctions (title, description, starting_price, end_time, bids_count) VALUES (?, ?, ?, ?, ?)',
        [auction.title, auction.description, auction.starting_price, auction.end_time, Math.floor(Math.random() * 20)]
      );
    }

    console.log('✅ Seeded database with 10 sample auctions');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();

