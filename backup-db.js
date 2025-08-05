#!/usr/bin/env node

/**
 * Local Database Backup Script for TimeTrack
 * 
 * This script creates a local backup of your MongoDB database
 * and saves it as a JSON file in the current directory.
 * 
 * Usage:
 *   node backup-db.js
 *   node backup-db.js --output=my-backup.json
 *   node backup-db.js --collections=users,timeEntries
 */

const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB connection
const mongoose = require('mongoose');

// Define models (simplified versions for backup)
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

// Collections to backup
const COLLECTIONS_TO_BACKUP = [
  { name: 'users', model: User },
  { name: 'timeEntries', model: TimeEntry },
  { name: 'userGoals', model: UserGoal },
  { name: 'feedback', model: Feedback },
  { name: 'feedbackVotes', model: FeedbackVote },
  { name: 'dayReflections', model: DayReflection }
];

// Parse command line arguments
const args = process.argv.slice(2);
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 
                   `time-track-backup-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;

const collectionsFilter = args.find(arg => arg.startsWith('--collections='))?.split('=')[1];
const collectionsToBackup = collectionsFilter 
  ? COLLECTIONS_TO_BACKUP.filter(col => collectionsFilter.split(',').includes(col.name))
  : COLLECTIONS_TO_BACKUP;

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

async function createBackup() {
  console.log('🔄 Starting database backup...');
  console.log(`📁 Output file: ${outputFile}`);
  console.log(`📊 Collections to backup: ${collectionsToBackup.map(c => c.name).join(', ')}`);
  console.log('');

  const startTime = new Date();
  
  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      type: 'local-backup',
      version: '1.0.0',
      source: 'time-track-app',
      script: 'backup-db.js'
    },
    collections: {}
  };

  let totalDocuments = 0;
  let successfulCollections = 0;
  let failedCollections = 0;

  // Backup each collection
  for (const collection of collectionsToBackup) {
    try {
      console.log(`📦 Backing up ${collection.name}...`);
      
      const documents = await collection.model.find({}).lean();
      
      backupData.collections[collection.name] = {
        status: 'success',
        count: documents.length,
        documents: documents
      };
      
      totalDocuments += documents.length;
      successfulCollections++;
      
      console.log(`   ✅ ${documents.length} documents backed up`);
      
    } catch (error) {
      console.error(`   ❌ Failed to backup ${collection.name}:`, error.message);
      
      backupData.collections[collection.name] = {
        status: 'failed',
        count: 0,
        error: error.message,
        documents: []
      };
      
      failedCollections++;
    }
  }

  backupData.metadata.totalDocuments = totalDocuments;
  backupData.metadata.successfulCollections = successfulCollections;
  backupData.metadata.failedCollections = failedCollections;

  // Save backup to file
  try {
    const backupPath = path.resolve(outputFile);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const fileSize = fs.statSync(backupPath).size;
    
    console.log('');
    console.log('🎉 Backup completed successfully!');
    console.log(`📄 File saved: ${backupPath}`);
    console.log(`📊 Total documents: ${totalDocuments.toLocaleString()}`);
    console.log(`📁 Collections: ${successfulCollections} successful, ${failedCollections} failed`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`💾 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Summary
    console.log('');
    console.log('📋 Backup Summary:');
    for (const [collectionName, data] of Object.entries(backupData.collections)) {
      const status = data.status === 'success' ? '✅' : '❌';
      console.log(`   ${status} ${collectionName}: ${data.count} documents`);
    }
    
  } catch (error) {
    console.error('❌ Failed to save backup file:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    await connectDB();
    await createBackup();
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Backup interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Backup terminated');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the backup
if (require.main === module) {
  main();
}

module.exports = { createBackup, connectDB }; 