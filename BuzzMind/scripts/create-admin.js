require('dotenv').config();

const mongoose = require('mongoose');
const connectDatabase = require('../config/database');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

async function main() {
  const [username, email, password, name = 'Admin'] = process.argv.slice(2);

  if (!username || !email || !password) {
    console.error(
      'Usage: node scripts/create-admin.js <username> <email> <password> [name]',
    );
    process.exit(1);
  }

  await connectDatabase();

  const existingAdmin = await User.findOne({ Role: 'admin' });
  if (existingAdmin) {
    existingAdmin.Name = name;
    existingAdmin.Username = username;
    existingAdmin.Email = email.toLowerCase();
    existingAdmin.Password = await hashPassword(password);
    existingAdmin.Department = 'MANAGEMENT';
    await existingAdmin.save();
    console.log(`Updated existing admin: ${existingAdmin.Username}`);
    return;
  }

  const admin = await User.create({
    Name: name,
    Username: username,
    Email: email.toLowerCase(),
    Password: await hashPassword(password),
    Role: 'admin',
    Department: 'MANAGEMENT',
  });

  console.log(`Created admin: ${admin.Username}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
