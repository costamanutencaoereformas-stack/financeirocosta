const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function enhanceCashFlowSchema() {
  try {
    console.log('Enhancing cash flow schema for Brazilian system...');
    
    // Add new columns
    await pool.query(`
      ALTER TABLE cash_flow_entries 
      ADD COLUMN IF NOT EXISTS competence_date DATE,
      ADD COLUMN IF NOT EXISTS subcategory_id VARCHAR(255) REFERENCES categories(id),
      ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS fees DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS document TEXT,
      ADD COLUMN IF NOT EXISTS cost_center TEXT,
      ADD COLUMN IF NOT EXISTS recurrence TEXT,
      ADD COLUMN IF NOT EXISTS due_date DATE,
      ADD COLUMN IF NOT EXISTS actual_date DATE
    `);
    
    // Make payment_method NOT NULL with default
    await pool.query(`
      ALTER TABLE cash_flow_entries 
      ALTER COLUMN payment_method SET NOT NULL,
      ALTER COLUMN payment_method SET DEFAULT 'money'
    `);
    
    // Update existing records with default payment method
    await pool.query(`
      UPDATE cash_flow_entries 
      SET payment_method = 'money' 
      WHERE payment_method IS NULL
    `);
    
    // Add indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_competence_date ON cash_flow_entries(competence_date);
      CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_due_date ON cash_flow_entries(due_date);
      CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_actual_date ON cash_flow_entries(actual_date);
      CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_cost_center ON cash_flow_entries(cost_center);
      CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_recurrence ON cash_flow_entries(recurrence)
    `);
    
    console.log('Cash flow schema enhanced successfully!');
    
  } catch (error) {
    console.error('Error enhancing schema:', error);
  } finally {
    await pool.end();
  }
}

enhanceCashFlowSchema();
