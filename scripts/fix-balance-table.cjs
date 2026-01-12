const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixBalanceTable() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS balance_adjustments;
      
      CREATE TABLE IF NOT EXISTS balance_adjustments (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
          date DATE NOT NULL,
          balance_type TEXT NOT NULL CHECK (balance_type IN ('initial', 'final')),
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          account TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          user_id VARCHAR(255) REFERENCES users(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_balance_adjustments_date ON balance_adjustments(date);
      CREATE INDEX IF NOT EXISTS idx_balance_adjustments_type ON balance_adjustments(balance_type);
      CREATE INDEX IF NOT EXISTS idx_balance_adjustments_user ON balance_adjustments(user_id);
    `);
    console.log('Balance adjustments table created successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixBalanceTable();
