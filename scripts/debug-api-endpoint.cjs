const { Pool } = require('pg');
require('dotenv').config();

// Simulate the storage.getAccountsPayable() method
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugApiEndpoint() {
  try {
    console.log('Simulating API endpoint response...');
    
    // This simulates what storage.getAccountsPayable() returns
    const result = await pool.query('SELECT * FROM accounts_payable WHERE late_fees IS NOT NULL LIMIT 3');
    
    console.log('Raw database response:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Check if the fields are properly mapped
    console.log('\nField mapping check:');
    result.rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`);
      console.log(`  - late_fees (DB): ${row.late_fees}`);
      console.log(`  - lateFees (JS): ${row.lateFees}`);
      console.log(`  - Has lateFees property: ${row.hasOwnProperty('lateFees')}`);
      console.log(`  - Keys: ${Object.keys(row)}`);
    });
    
  } catch (error) {
    console.error('Error debugging API endpoint:', error);
  } finally {
    await pool.end();
  }
}

debugApiEndpoint();
