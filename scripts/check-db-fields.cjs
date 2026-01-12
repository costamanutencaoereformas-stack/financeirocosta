const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDatabaseFields() {
  try {
    console.log('Checking accounts_payable table structure...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'accounts_payable' 
      ORDER BY ordinal_position
    `);
    
    console.log('Accounts Payable table columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if late_fees column exists
    const hasLateFees = result.rows.some(row => row.column_name === 'late_fees');
    const hasPaymentMethod = result.rows.some(row => row.column_name === 'payment_method');
    const hasActive = result.rows.some(row => row.column_name === 'active');
    
    console.log('\nField status:');
    console.log(`- late_fees: ${hasLateFees ? 'EXISTS' : 'MISSING'}`);
    console.log(`- payment_method: ${hasPaymentMethod ? 'EXISTS' : 'MISSING'}`);
    console.log(`- active: ${hasActive ? 'EXISTS' : 'MISSING'}`);
    
    // Check sample data
    const sampleData = await pool.query('SELECT * FROM accounts_payable LIMIT 3');
    console.log('\nSample data:');
    sampleData.rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, {
        id: row.id,
        description: row.description,
        amount: row.amount,
        late_fees: row.late_fees,
        payment_method: row.payment_method,
        active: row.active
      });
    });
    
  } catch (error) {
    console.error('Error checking database fields:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseFields();
