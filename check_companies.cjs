const { drizzle } = require('drizzle-orm/node-postgres-js');
const { eq } = require('drizzle-orm');
const { companies } = require('./shared/schema.js');
const db = require('./server/db.js');

async function checkCompanies() {
  try {
    const allCompanies = await db.select().from(companies);
    console.log('Empresas encontradas:');
    allCompanies.forEach(company => {
      console.log(`ID: ${company.id}, Nome: ${company.nome}, Status: ${company.status}`);
    });
  } catch (error) {
    console.error('Erro:', error);
  }
  process.exit(0);
}

checkCompanies();
