require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ companyId: mongoose.Schema.Types.ObjectId }));
  
  const result = await User.updateMany(
    { companyId: null },
    [{ $set: { companyId: '$_id' } }]
  );
  
  console.log('Migrated', result.modifiedCount, 'users');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
