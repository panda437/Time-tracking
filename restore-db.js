#!/usr/bin/env node

/**
 * Local Database Restore Script for TimeTrack
 * 
 * This script restores your MongoDB database from a backup JSON file.
 * 
 * ⚠️  WARNING: This will overwrite existing data in your database!
 * 
 * Usage:
 *   node restore-db.js backup-file.json
 *   node restore-db.js backup-file.json --collections=users,timeEntries
 *   node restore-db.js backup-file.json --dry-run
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB connection
const mongoose = require('mongoose');

// Define models (simplified versions for restore)
const userSchema = new mongoose.Schema({}, { strict: false });
const timeEntrySchema = new mongoose.Schema({}, { strict: false });
const userGoalSchema = new mongoose.Schema({}, { strict: false });
const feedbackSchema = new mongoose.Schema({}, { strict: false });
const feedbackVoteSchema = new mongoose.Schema({}, { strict: false });
const dayReflectionSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);
const UserGoal = mongoose.model('UserGoal', userGoalSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);
const FeedbackVote = mongoose.model('FeedbackVote', feedbackVoteSchema);
const DayReflection = mongoose.model('DayReflection', dayReflectionSchema);

// Collection mapping
const COLLECTION_MODELS = {
  'users': User,
  'timeEntries': TimeEntry,
  'userGoals': UserGoal,
  'feedback': Feedback,
  'feedbackVotes': FeedbackVote,
  'dayReflections': DayReflection
};

// Parse command line arguments
const args = process.argv.slice(2);
const backupFile = args[0];
const collectionsFilter = args.find(arg => arg.startsWith('--collections='))?.split('=')[1];
const isDryRun = args.includes('--dry-run');

if (!backupFile) {
  console.error('❌ Please provide a backup file path');
  console.log('Usage: node restore-db.js backup-file.json [--collections=users,timeEntries] [--dry-run]');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(`❌ Backup file not found: ${backupFile}`);
  process.exit(1);
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in .env.local');
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function restoreBackup() {
  console.log('🔄 Starting database restore...');
  console.log(`📁 Backup file: ${backupFile}`);
  console.log(`🔍 Dry run: ${isDryRun ? 'Yes' : 'No'}`);
  
  if (collectionsFilter) {
    console.log(`📊 Collections to restore: ${collectionsFilter}`);
  } else {
    console.log(`📊 Collections to restore: all available`);
  }
  console.log('');

  if (!isDryRun) {
    console.log('⚠️  WARNING: This will overwrite existing data in your database!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    // Wait 5 seconds to give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const startTime = new Date();
  
  // Load backup data
  let backupData;
  try {
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    backupData = JSON.parse(backupContent);
    console.log('✅ Backup file loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load backup file:', error.message);
    process.exit(1);
  }

  // Validate backup structure
  if (!backupData.collections || typeof backupData.collections !== 'object') {
    console.error('❌ Invalid backup file format: missing collections data');
    process.exit(1);
  }

  let totalDocuments = 0;
  let successfulCollections = 0;
  let failedCollections = 0;

  // Determine which collections to restore
  const collectionsToRestore = collectionsFilter 
    ? collectionsFilter.split(',').filter(col => backupData.collections[col])
    : Object.keys(backupData.collections);

  // Restore each collection
  for (const collectionName of collectionsToRestore) {
    const collectionData = backupData.collections[collectionName];
    const model = COLLECTION_MODELS[collectionName];

    if (!model) {
      console.log(`⚠️  Skipping unknown collection: ${collectionName}`);
      continue;
    }

    if (collectionData.status !== 'success') {
      console.log(`⚠️  Skipping failed collection: ${collectionName} (${collectionData.error})`);
      continue;
    }

    try {
      console.log(`📦 Restoring ${collectionName}...`);
      
      if (isDryRun) {
        console.log(`   🔍 Would restore ${collectionData.count} documents (dry run)`);
        totalDocuments += collectionData.count;
        successfulCollections++;
        continue;
      }

      // Clear existing data
      await model.deleteMany({});
      console.log(`   🗑️  Cleared existing ${collectionName} data`);

      // Insert backup data
      if (collectionData.documents && collectionData.documents.length > 0) {
        await model.insertMany(collectionData.documents);
        console.log(`   ✅ Restored ${collectionData.count} documents`);
      } else {
        console.log(`   ℹ️  No documents to restore for ${collectionName}`);
      }
      
      totalDocuments += collectionData.count;
      successfulCollections++;
      
    } catch (error) {
      console.error(`   ❌ Failed to restore ${collectionName}:`, error.message);
      failedCollections++;
    }
  }

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  
  console.log('');
  if (isDryRun) {
    console.log('🔍 Dry run completed!');
    console.log(`📊 Would restore: ${totalDocuments.toLocaleString()} documents`);
    console.log(`📁 Collections: ${successfulCollections} would succeed, ${failedCollections} would fail`);
  } else {
    console.log('🎉 Restore completed successfully!');
    console.log(`📊 Total documents restored: ${totalDocuments.toLocaleString()}`);
    console.log(`📁 Collections: ${successfulCollections} successful, ${failedCollections} failed`);
  }
  console.log(`⏱️  Duration: ${duration}ms`);
  
  // Summary
  console.log('');
  console.log('📋 Restore Summary:');
  for (const collectionName of collectionsToRestore) {
    const collectionData = backupData.collections[collectionName];
    if (collectionData && collectionData.status === 'success') {
      const status = isDryRun ? '🔍' : '✅';
      console.log(`   ${status} ${collectionName}: ${collectionData.count} documents`);
    } else if (collectionData) {
      console.log(`   ❌ ${collectionName}: failed (${collectionData.error})`);
    }
  }
}

async function main() {
  try {
    await connectDB();
    await restoreBackup();
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Restore interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Restore terminated');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the restore
if (require.main === module) {
  main();
}

module.exports = { restoreBackup, connectDB }; 