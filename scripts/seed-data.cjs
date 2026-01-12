const { storage } = require('./server/storage');

async function seedData() {
  try {
    console.log('Seeding default data...');
    await storage.seedDefaultData();
    console.log('Data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData();