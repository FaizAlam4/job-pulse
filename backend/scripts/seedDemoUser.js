/**
 * Seed Demo User Script
 * Creates a demo user for interviewer/testing purposes
 * Run: node scripts/seedDemoUser.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-pulse';

// Demo user credentials - keep in sync with frontend LoginModal.tsx
const DEMO_USER = {
  email: 'demo@jobpulse.com',
  password: 'Demo@123',
  name: 'Demo User',
  profileType: 'job-seeker',
  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
  experience: 3,
  location: 'Remote',
  bio: 'Demo account for testing the Job Pulse application',
};

// Simple User schema for this script
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  profileType: { type: String, default: 'job-seeker' },
  skills: [String],
  experience: Number,
  location: String,
  bio: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seedDemoUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: DEMO_USER.email });
    
    if (existingUser) {
      console.log('ℹ️  Demo user already exists');
      console.log(`   Email: ${DEMO_USER.email}`);
      console.log(`   Password: ${DEMO_USER.password}`);
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(DEMO_USER.password, salt);

      // Create demo user
      const demoUser = new User({
        ...DEMO_USER,
        password: hashedPassword,
      });

      await demoUser.save();
      console.log('✅ Demo user created successfully!');
      console.log(`   Email: ${DEMO_USER.email}`);
      console.log(`   Password: ${DEMO_USER.password}`);
    }

    console.log('\n📋 Demo Credentials:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email:    ${DEMO_USER.email}`);
    console.log(`   Password: ${DEMO_USER.password}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding demo user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedDemoUser();
