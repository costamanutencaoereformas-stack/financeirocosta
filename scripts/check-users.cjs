const { Client } = require('pg');

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT id, username, name, role FROM users');
    console.log('Users in database:');
    result.rows.forEach(row => {
      console.log(`- ${row.username} (${row.name}) - ${row.role}`);
    });

    if (result.rows.length === 0) {
      console.log('No users found. Creating admin user...');
      // Hash the password
      const { hashPassword } = require('./server/auth');
      const hashedPassword = await hashPassword('admin123');

      await client.query(
        'INSERT INTO users (id, username, name, password, role, active) VALUES ($1, $2, $3, $4, $5, $6)',
        ['1', 'admin', 'Administrator', hashedPassword, 'admin', true]
      );
      console.log('Admin user created successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkUsers();