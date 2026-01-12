const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkApiResponse() {
  try {
    console.log('Checking API response structure...');
    
    // Simulate what the API would return
    const result = await pool.query(`
      SELECT id, description, amount, due_date, payment_date, status, 
             supplier_id, category_id, cost_center_id, payment_method, 
             late_fees, notes, attachment_url, recurrence, active
      FROM accounts_payable 
      WHERE late_fees IS NOT NULL
      LIMIT 3
    `);
    
    console.log('Raw database rows:');
    result.rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });
    
    // Simulate the transformation that should happen in the API
    const transformed = result.rows.map(row => ({
      id: row.id,
      description: row.description,
      amount: row.amount,
      dueDate: row.due_date,
      paymentDate: row.payment_date,
      status: row.status,
      supplierId: row.supplier_id,
      categoryId: row.category_id,
      costCenterId: row.cost_center_id,
      paymentMethod: row.payment_method,
      lateFees: row.late_fees, // This is the key mapping!
      notes: row.notes,
      attachmentUrl: row.attachment_url,
      recurrence: row.recurrence,
      active: row.active
    }));
    
    console.log('\nTransformed API response (what frontend should receive):');
    transformed.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, {
        id: row.id,
        description: row.description,
        amount: row.amount,
        lateFees: row.lateFees
      });
    });
    
    // Calculate total late fees as frontend would
    const totalLateFees = transformed.reduce((sum, acc) => sum + (acc.lateFees && acc.lateFees !== null ? parseFloat(acc.lateFees) : 0), 0);
    console.log(`\nTotal late fees (frontend calculation): ${totalLateFees.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error checking API response:', error);
  } finally {
    await pool.end();
  }
}

checkApiResponse();
