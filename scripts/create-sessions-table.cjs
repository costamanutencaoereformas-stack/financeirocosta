const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createSessionsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid varchar NOT NULL PRIMARY KEY,
        sess json NOT NULL,
        expire timestamp(6) NOT NULL
      )
    `);
    console.log('User sessions table created successfully');
  } catch (error) {
    console.error('Error creating sessions table:', error);
  } finally {
    await pool.end();
  }
}

createSessionsTable();
