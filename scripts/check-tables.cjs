const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    console.log('Checking cash_flow_entries table...');
    const cashFlowResult = await pool.query('SELECT COUNT(*) FROM cash_flow_entries');
    console.log(`Cash flow entries: ${cashFlowResult.rows[0].count}`);

    console.log('Checking balance_adjustments table...');
    const balanceResult = await pool.query('SELECT COUNT(*) FROM balance_adjustments');
    console.log(`Balance adjustments: ${balanceResult.rows[0].count}`);

    console.log('Checking accounts_payable table...');
    const payablesResult = await pool.query('SELECT COUNT(*) FROM accounts_payable');
    console.log(`Accounts payable: ${payablesResult.rows[0].count}`);

    console.log('Checking accounts_receivable table...');
    const receivablesResult = await pool.query('SELECT COUNT(*) FROM accounts_receivable');
    console.log(`Accounts receivable: ${receivablesResult.rows[0].count}`);

    console.log('Sample cash flow entries:');
    const sampleCashFlow = await pool.query('SELECT * FROM cash_flow_entries LIMIT 3');
    console.log(sampleCashFlow.rows);

    console.log('Sample balance adjustments:');
    const sampleBalance = await pool.query('SELECT * FROM balance_adjustments LIMIT 3');
    console.log(sampleBalance.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
