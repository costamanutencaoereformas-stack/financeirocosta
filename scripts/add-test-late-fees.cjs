const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addTestLateFees() {
  try {
    console.log('Adding test late fees to existing accounts...');
    
    // Get first few accounts
    const result = await pool.query('SELECT id, description FROM accounts_payable WHERE status = $1 LIMIT 3', ['pending']);
    
    if (result.rows.length === 0) {
      console.log('No pending accounts found. Creating a test account...');
      
      // Create a test account with late fees
      const testAccount = await pool.query(`
        INSERT INTO accounts_payable (description, amount, due_date, status, late_fees, payment_method, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, description, amount, late_fees
      `, [
        'Test Account with Late Fees',
        '100.00',
        '2024-12-20',
        'paid',
        '15.50',
        'transfer',
        true
      ]);
      
      console.log('Created test account:', testAccount.rows[0]);
    } else {
      // Add late fees to existing accounts
      for (const account of result.rows) {
        const lateFee = (Math.random() * 50 + 5).toFixed(2); // Random late fee between 5-55
        
        await pool.query(`
          UPDATE accounts_payable 
          SET late_fees = $1 
          WHERE id = $2
        `, [lateFee, account.id]);
        
        console.log(`Added ${lateFee} late fees to account: ${account.description}`);
      }
    }
    
    // Check final state
    const finalResult = await pool.query(`
      SELECT id, description, amount, late_fees, status 
      FROM accounts_payable 
      WHERE late_fees IS NOT NULL 
      ORDER BY id
    `);
    
    console.log('\nAccounts with late fees:');
    finalResult.rows.forEach(row => {
      console.log(`- ${row.description}: ${row.amount} + ${row.late_fees} (status: ${row.status})`);
    });
    
    // Calculate total late fees
    const totalLateFees = finalResult.rows.reduce((sum, row) => sum + parseFloat(row.late_fees), 0);
    console.log(`\nTotal late fees: ${totalLateFees.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error adding test late fees:', error);
  } finally {
    await pool.end();
  }
}

addTestLateFees();
