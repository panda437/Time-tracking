import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { 
  User, 
  TimeEntry, 
  UserGoal, 
  Feedback, 
  FeedbackVote, 
  DayReflection,
  BackupMetadata,
  BackupData
} from "@/lib/models"
import { format } from "date-fns"
import { sendBackupFailureNotification, sendBackupSuccessNotification } from "@/lib/email"

// Collections to backup
const COLLECTIONS_TO_BACKUP = [
  { name: 'users', model: User },
  { name: 'timeEntries', model: TimeEntry },
  { name: 'userGoals', model: UserGoal },
  { name: 'feedback', model: Feedback },
  { name: 'feedbackVotes', model: FeedbackVote },
  { name: 'dayReflections', model: DayReflection }
]

// Manual backup - returns downloadable JSON
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const automated = searchParams.get("automated") === "true"

  // For automated backups (cron job), skip auth check
  if (!automated) {
    // Manual backup requires authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    await connectDB()

    const backupData: any = {
      metadata: {
        timestamp: new Date().toISOString(),
        type: automated ? 'automated' : 'manual',
        version: '1.0.0',
        source: 'time-track-app'
      },
      collections: {}
    }

    let totalDocuments = 0

    // Backup each collection
    for (const collection of COLLECTIONS_TO_BACKUP) {
      try {
        const documents = await collection.model.find({}).lean()
        backupData.collections[collection.name] = {
          status: 'success',
          count: documents.length,
          documents: documents
        }
        totalDocuments += documents.length
      } catch (error) {
        console.error(`Error backing up ${collection.name}:`, error)
        backupData.collections[collection.name] = {
          status: 'failed',
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          documents: []
        }
      }
    }

    backupData.metadata.totalDocuments = totalDocuments

    // For manual download, return the backup as downloadable JSON
    if (!automated) {
      const filename = `time-track-backup-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`
      
      return new NextResponse(JSON.stringify(backupData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // For automated backups, trigger the storage logic
    return await handleAutomatedBackup()

  } catch (error) {
    console.error("Backup error:", error)
    return NextResponse.json({ 
      error: "Backup failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

// Automated backup - stores in MongoDB with retention policy
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Check if user is admin
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  return await handleAutomatedBackup()
}

async function handleAutomatedBackup() {
  try {
    await connectDB()

    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const startTime = new Date()

    // Create backup metadata record
    const backupMetadata = await BackupMetadata.create({
      backupId,
      type: 'automated',
      status: 'in_progress',
      startTime,
      collections: {},
      totalDocuments: 0,
      backupSize: 0
    })

    let totalDocuments = 0
    let totalSize = 0
    const collectionsStatus: any = {}

    // Backup each collection
    for (const collection of COLLECTIONS_TO_BACKUP) {
      try {
        const documents = await collection.model.find({}).lean()
        
        // Store backup data
        const backupData = await BackupData.create({
          backupId,
          collectionName: collection.name,
          data: documents
        })

        collectionsStatus[collection.name] = {
          status: 'success',
          count: documents.length
        }

        totalDocuments += documents.length
        totalSize += JSON.stringify(documents).length

      } catch (error) {
        console.error(`Error backing up ${collection.name}:`, error)
        collectionsStatus[collection.name] = {
          status: 'failed',
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Update backup metadata
    const endTime = new Date()
    await BackupMetadata.findByIdAndUpdate(backupMetadata._id, {
      status: 'completed',
      endTime,
      collections: collectionsStatus,
      totalDocuments,
      backupSize: totalSize
    })

    // Apply retention policy
    await applyRetentionPolicy()

    // Send success notification email
    try {
      await sendBackupSuccessNotification(backupId, {
        totalDocuments,
        backupSize: totalSize,
        duration: endTime.getTime() - startTime.getTime()
      })
      console.log('✅ Backup success notification sent')
    } catch (error) {
      console.error('❌ Failed to send backup success notification:', error)
    }

    return NextResponse.json({
      success: true,
      backupId,
      totalDocuments,
      backupSize: totalSize,
      duration: endTime.getTime() - startTime.getTime(),
      collections: collectionsStatus
    })

  } catch (error) {
    console.error("Automated backup error:", error)
    
    // Send failure notification email
    try {
      const backupId = `failed-${Date.now()}`
      await sendBackupFailureNotification(backupId, error instanceof Error ? error.message : "Unknown error")
      console.log('✅ Backup failure notification sent')
    } catch (emailError) {
      console.error('❌ Failed to send backup failure notification:', emailError)
    }
    
    return NextResponse.json({ 
      error: "Automated backup failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

async function applyRetentionPolicy() {
  try {
    // Get all backups sorted by creation date (newest first)
    const allBackups = await BackupMetadata.find({ status: 'completed' })
      .sort({ createdAt: -1 })

    // Keep last 7 daily backups
    const backupsToKeep = allBackups.slice(0, 7)
    
    // Keep one monthly backup (approximately 30 days old)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const monthlyBackup = allBackups.find(backup => 
      backup.createdAt <= thirtyDaysAgo && 
      !backupsToKeep.includes(backup)
    )
    
    if (monthlyBackup) {
      backupsToKeep.push(monthlyBackup)
    }

    // Find backups to delete
    const backupsToDelete = allBackups.filter(backup => 
      !backupsToKeep.includes(backup)
    )

    // Delete old backups
    for (const backup of backupsToDelete) {
      await BackupData.deleteMany({ backupId: backup.backupId })
      await BackupMetadata.findByIdAndDelete(backup._id)
      console.log(`Deleted old backup: ${backup.backupId}`)
    }

    console.log(`Retention policy applied: kept ${backupsToKeep.length} backups, deleted ${backupsToDelete.length} backups`)

  } catch (error) {
    console.error("Error applying retention policy:", error)
  }
} 