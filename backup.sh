#!/bin/bash

# TimeTrack Database Backup Script
# 
# This script provides an easy way to backup your MongoDB database locally.
# 
# Usage:
#   ./backup.sh                    # Create backup with default filename
#   ./backup.sh my-backup.json     # Create backup with custom filename
#   ./backup.sh --help             # Show help information

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo "TimeTrack Database Backup Script"
    echo ""
    echo "Usage:"
    echo "  ./backup.sh                    # Create backup with default filename"
    echo "  ./backup.sh my-backup.json     # Create backup with custom filename"
    echo "  ./backup.sh --help             # Show this help information"
    echo ""
    echo "Examples:"
    echo "  ./backup.sh"
    echo "  ./backup.sh backup-$(date +%Y%m%d).json"
    echo "  ./backup.sh --help"
    echo ""
    echo "The backup will be saved as a JSON file in the current directory."
    echo "Make sure you have a .env.local file with your MONGODB_URI configured."
}

# Check if help is requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the backup script exists
if [[ ! -f "backup-db.js" ]]; then
    print_error "backup-db.js script not found. Please make sure you're in the correct directory."
    exit 1
fi

# Check if .env.local exists
if [[ ! -f ".env.local" ]]; then
    print_warning ".env.local file not found. Make sure you have your MONGODB_URI configured."
    print_status "You can create .env.local with: MONGODB_URI=your_mongodb_connection_string"
fi

# Determine output filename
if [[ -n "$1" ]]; then
    OUTPUT_FILE="$1"
    print_status "Using custom output filename: $OUTPUT_FILE"
else
    OUTPUT_FILE=""
    print_status "Using default output filename (timestamped)"
fi

# Run the backup
print_status "Starting database backup..."
print_status "This may take a few moments depending on your database size..."

if [[ -n "$OUTPUT_FILE" ]]; then
    node backup-db.js --output="$OUTPUT_FILE"
else
    node backup-db.js
fi

if [[ $? -eq 0 ]]; then
    print_success "Backup completed successfully!"
    
    # Show the backup file if it was created
    if [[ -n "$OUTPUT_FILE" && -f "$OUTPUT_FILE" ]]; then
        FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
        print_status "Backup file: $OUTPUT_FILE (Size: $FILE_SIZE)"
    else
        # Find the most recent backup file
        LATEST_BACKUP=$(ls -t time-track-backup-*.json 2>/dev/null | head -1)
        if [[ -n "$LATEST_BACKUP" ]]; then
            FILE_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
            print_status "Backup file: $LATEST_BACKUP (Size: $FILE_SIZE)"
        fi
    fi
else
    print_error "Backup failed. Please check the error messages above."
    exit 1
fi 