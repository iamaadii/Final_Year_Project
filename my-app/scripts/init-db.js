const path = require('path');
const mongoose = require('mongoose');
const { loadEnvConfig } = require('@next/env');

const projectDir = path.resolve(__dirname, '../');
loadEnvConfig(projectDir);

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ Please define MONGODB_URI in your .env.local');
    process.exit(1);
  }
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: 'MyUsers' });
    console.log('✅ Connected to MongoDB.');

    console.log("Initializing collections if they don't exist...");
    
    const collectionsToInit = ['users', 'invoices', 'notifications', 'auditlogs', 'purchaseorders', 'journalentries', 'grns', 'incidentlogs', 'counterpartylinks'];
    const existing = await mongoose.connection.db.listCollections().toArray();
    const existingNames = existing.map(c => c.name);

    for (const coll of collectionsToInit) {
      if (!existingNames.includes(coll)) {
        await mongoose.connection.db.createCollection(coll);
        console.log(`✅ Created collection: ${coll}`);
      } else {
        console.log(`ℹ️ Collection already exists: ${coll}`);
      }
    }
    
    console.log('✅ DB schema initialization complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed DB Init:', err);
    process.exit(1);
  }
}

main();
