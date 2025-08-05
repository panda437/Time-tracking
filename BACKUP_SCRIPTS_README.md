# TimeTrack Local Backup Scripts

This directory contains scripts to backup and restore your TimeTrack MongoDB database locally.

## 📁 Files

- `backup-db.js` - Node.js script to create database backups
- `backup.sh` - Shell script wrapper for easy backup execution
- `restore-db.js` - Node.js script to restore from backup files
- `BACKUP_SCRIPTS_README.md` - This documentation

## 🚀 Quick Start

### Prerequisites

1. **Node.js** installed on your system
2. **MongoDB connection string** in your `.env.local` file
3. **Project dependencies** installed (`npm install`)

### Create a Backup

```bash
# Simple backup with default filename
./backup.sh

# Backup with custom filename
./backup.sh my-backup.json

# Backup specific collections only
node backup-db.js --collections=users,timeEntries

# Show help
./backup.sh --help
```

### Restore from Backup

```bash
# Restore all collections (with 5-second warning)
node restore-db.js backup-file.json

# Dry run (see what would be restored without actually doing it)
node restore-db.js backup-file.json --dry-run

# Restore specific collections only
node restore-db.js backup-file.json --collections=users,timeEntries
```

## 📊 What Gets Backed Up

The backup includes all your TimeTrack data:

- **Users** - User accounts and profiles
- **Time Entries** - Time tracking records with activities, categories, and moods
- **User Goals** - User-defined goals and objectives
- **Feedback** - User feedback and feature requests
- **Feedback Votes** - Voting data for feedback items
- **Day Reflections** - Daily reflection entries with ratings and insights

## 🔧 Configuration

### Environment Setup

Make sure your `.env.local` file contains:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### File Permissions

Make the shell script executable:

```bash
chmod +x backup.sh
```

## 📋 Usage Examples

### Daily Backup

```bash
# Create a daily backup with timestamp
./backup.sh backup-$(date +%Y%m%d).json
```

### Selective Backup

```bash
# Backup only user data and time entries
node backup-db.js --collections=users,timeEntries --output=user-data-backup.json
```

### Safe Restore Testing

```bash
# First, do a dry run to see what would be restored
node restore-db.js backup-file.json --dry-run

# If everything looks good, do the actual restore
node restore-db.js backup-file.json
```

### Restore Specific Data

```bash
# Restore only user accounts (useful for user management)
node restore-db.js backup-file.json --collections=users
```

## ⚠️ Important Warnings

### Before Restoring

1. **Always test with dry-run first** - Use `--dry-run` to see what would be restored
2. **Backup current data** - Create a backup before restoring
3. **Check backup file integrity** - Ensure the backup file is complete and valid
4. **Stop the application** - Prevent data conflicts during restore

### Data Safety

- **Restore overwrites existing data** - Be very careful with restore operations
- **No automatic rollback** - There's no automatic way to undo a restore
- **Test in development first** - Always test restore procedures in a safe environment

## 🔍 Troubleshooting

### Common Issues

**"MONGODB_URI not found"**
```bash
# Check your .env.local file exists and contains MONGODB_URI
cat .env.local
```

**"Permission denied"**
```bash
# Make the script executable
chmod +x backup.sh
```

**"Backup file not found"**
```bash
# Check the file path and permissions
ls -la backup-file.json
```

**"Connection failed"**
```bash
# Verify your MongoDB connection string
# Check network connectivity
# Ensure MongoDB is running
```

### Error Recovery

If a backup or restore fails:

1. **Check the error messages** - Look for specific collection or connection errors
2. **Verify database connectivity** - Test your MongoDB connection
3. **Check file permissions** - Ensure scripts can read/write files
4. **Review backup file** - Validate the backup file structure

## 📈 Backup File Format

Backup files are JSON with this structure:

```json
{
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "type": "local-backup",
    "version": "1.0.0",
    "source": "time-track-app",
    "totalDocuments": 1234,
    "successfulCollections": 6,
    "failedCollections": 0
  },
  "collections": {
    "users": {
      "status": "success",
      "count": 50,
      "documents": [...]
    },
    "timeEntries": {
      "status": "success", 
      "count": 1184,
      "documents": [...]
    }
  }
}
```

## 🔄 Integration with Existing Backup System

These local scripts work alongside your existing automated backup system:

- **Local scripts** - For manual backups and development
- **Automated system** - Daily backups via Vercel cron jobs
- **Both systems** - Use the same data format for compatibility

## 📞 Support

If you encounter issues:

1. **Check the error messages** - They usually contain helpful information
2. **Verify your setup** - Ensure all prerequisites are met
3. **Test with a small dataset** - Try backing up/restoring just one collection
4. **Review the logs** - Look for detailed error information

## 🎯 Best Practices

### Regular Backups

- **Daily backups** - Use the automated system for regular backups
- **Before major changes** - Create manual backups before updates
- **Before testing** - Backup before trying new features

### Safe Restores

- **Always dry-run first** - Never restore without testing
- **Backup before restore** - Create a backup of current state
- **Test in isolation** - Use a separate database for testing
- **Verify after restore** - Check that data is correct after restore

### File Management

- **Organize backups** - Use descriptive filenames with dates
- **Compress old backups** - Save space by compressing old files
- **Store securely** - Keep backups in a safe location
- **Regular cleanup** - Remove very old backups to save space

---

**Remember**: These scripts are powerful tools. Always test restore procedures in a safe environment before using them on production data! 