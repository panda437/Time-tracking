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
import { subHours, subDays } from "date-fns"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()

    // Get recent backup statistics
    const thirtyDaysAgo = subDays(new Date(), 30)
    const twentySixHoursAgo = subHours(new Date(), 26)

    // Get all backups in the last 30 days
    const recentBackups = await BackupMetadata.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 })

    // Get the most recent backup
    const latestBackup = recentBackups[0]

    // Calculate health status
    const healthChecks = await performHealthChecks(latestBackup, twentySixHoursAgo)

    // Calculate reliability metrics
    const reliabilityMetrics = calculateReliabilityMetrics(recentBackups)

    // Get current database statistics
    const databaseStats = await getCurrentDatabaseStats()

    // Get backup storage statistics
    const storageStats = await getBackupStorageStats()

    const status = {
      // Overall health
      health: {
        status: healthChecks.overall,
        checks: healthChecks.individual,
        lastUpdated: new Date().toISOString()
      },

      // Latest backup info
      latestBackup: latestBackup ? {
        id: latestBackup.backupId,
        type: latestBackup.type,
        status: latestBackup.status,
        createdAt: latestBackup.createdAt,
        duration: latestBackup.endTime ? 
          latestBackup.endTime.getTime() - latestBackup.startTime.getTime() : null,
        totalDocuments: latestBackup.totalDocuments,
        backupSize: formatBytes(latestBackup.backupSize),
        collections: latestBackup.collections
      } : null,

      // Reliability metrics (30-day window)
      reliability: reliabilityMetrics,

      // Current database statistics
      database: databaseStats,

      // Backup storage statistics
      storage: storageStats,

      // Recent backup history (last 10)
      recentBackups: recentBackups.slice(0, 10).map(backup => ({
        id: backup.backupId,
        type: backup.type,
        status: backup.status,
        createdAt: backup.createdAt,
        totalDocuments: backup.totalDocuments,
        backupSize: formatBytes(backup.backupSize),
        duration: backup.endTime ? 
          backup.endTime.getTime() - backup.startTime.getTime() : null
      }))
    }

    return NextResponse.json(status)

  } catch (error) {
    console.error("Error getting backup status:", error)
    return NextResponse.json({ 
      error: "Failed to get backup status", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

async function performHealthChecks(latestBackup: any, twentySixHoursAgo: Date) {
  const checks = {
    databaseConnection: { status: 'unknown', message: '' },
    recentBackup: { status: 'unknown', message: '' },
    backupIntegrity: { status: 'unknown', message: '' },
    retentionCompliance: { status: 'unknown', message: '' },
    cronSchedule: { status: 'unknown', message: '' }
  }

  // 1. Database Connection Check
  try {
    await User.countDocuments()
    checks.databaseConnection = { 
      status: 'healthy', 
      message: 'Database connection successful' 
    }
  } catch (error) {
    checks.databaseConnection = { 
      status: 'critical', 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }

  // 2. Recent Backup Check
  if (!latestBackup) {
    checks.recentBackup = { 
      status: 'critical', 
      message: 'No backups found' 
    }
  } else if (latestBackup.createdAt < twentySixHoursAgo) {
    checks.recentBackup = { 
      status: 'warning', 
      message: 'Latest backup is older than 26 hours' 
    }
  } else if (latestBackup.status === 'failed') {
    checks.recentBackup = { 
      status: 'critical', 
      message: 'Latest backup failed' 
    }
  } else {
    checks.recentBackup = { 
      status: 'healthy', 
      message: 'Recent backup completed successfully' 
    }
  }

  // 3. Backup Integrity Check
  if (latestBackup && latestBackup.status === 'completed') {
    const failedCollections = Object.entries(latestBackup.collections || {})
      .filter(([_, info]: [string, any]) => info.status === 'failed')
    
    if (failedCollections.length > 0) {
      checks.backupIntegrity = { 
        status: 'warning', 
        message: `${failedCollections.length} collection(s) failed in latest backup` 
      }
    } else {
      checks.backupIntegrity = { 
        status: 'healthy', 
        message: 'All collections backed up successfully' 
      }
    }
  } else {
    checks.backupIntegrity = { 
      status: 'warning', 
      message: 'Cannot verify backup integrity' 
    }
  }

  // 4. Retention Policy Compliance Check
  try {
    const allBackups = await BackupMetadata.find({ status: 'completed' })
      .sort({ createdAt: -1 })
    
    const dailyBackups = allBackups.slice(0, 7)
    const oldBackups = allBackups.slice(7)
    
    if (dailyBackups.length >= 3) { // At least 3 recent backups
      checks.retentionCompliance = { 
        status: 'healthy', 
        message: `${dailyBackups.length} recent backups available` 
      }
    } else {
      checks.retentionCompliance = { 
        status: 'warning', 
        message: `Only ${dailyBackups.length} recent backups available` 
      }
    }
  } catch (error) {
    checks.retentionCompliance = { 
      status: 'warning', 
      message: 'Cannot verify retention compliance' 
    }
  }

  // 5. Cron Schedule Check (based on backup frequency)
  try {
    const last48Hours = subHours(new Date(), 48)
    const recentAutomatedBackups = await BackupMetadata.find({
      type: 'automated',
      createdAt: { $gte: last48Hours }
    })
    
    if (recentAutomatedBackups.length >= 1) {
      checks.cronSchedule = { 
        status: 'healthy', 
        message: 'Automated backups running on schedule' 
      }
    } else {
      checks.cronSchedule = { 
        status: 'warning', 
        message: 'No automated backups in the last 48 hours' 
      }
    }
  } catch (error) {
    checks.cronSchedule = { 
      status: 'warning', 
      message: 'Cannot verify cron schedule' 
    }
  }

  // Determine overall health
  const criticalCount = Object.values(checks).filter(check => check.status === 'critical').length
  const warningCount = Object.values(checks).filter(check => check.status === 'warning').length
  
  let overall = 'healthy'
  if (criticalCount > 0) {
    overall = 'critical'
  } else if (warningCount > 0) {
    overall = 'warning'
  }

  return { overall, individual: checks }
}

function calculateReliabilityMetrics(backups: any[]) {
  if (backups.length === 0) {
    return {
      successRate: 0,
      averageFrequency: 0,
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0
    }
  }

  const successfulBackups = backups.filter(b => b.status === 'completed').length
  const failedBackups = backups.filter(b => b.status === 'failed').length
  const successRate = (successfulBackups / backups.length) * 100

  // Calculate average frequency (hours between backups)
  let averageFrequency = 0
  if (backups.length > 1) {
    const intervals = []
    for (let i = 0; i < backups.length - 1; i++) {
      const diff = backups[i].createdAt.getTime() - backups[i + 1].createdAt.getTime()
      intervals.push(diff / (1000 * 60 * 60)) // Convert to hours
    }
    averageFrequency = intervals.reduce((a, b) => a + b, 0) / intervals.length
  }

  return {
    successRate: Math.round(successRate * 100) / 100,
    averageFrequency: Math.round(averageFrequency * 100) / 100,
    totalBackups: backups.length,
    successfulBackups,
    failedBackups
  }
}

async function getCurrentDatabaseStats() {
  try {
    const stats = {
      users: await User.countDocuments(),
      timeEntries: await TimeEntry.countDocuments(),
      userGoals: await UserGoal.countDocuments(),
      feedback: await Feedback.countDocuments(),
      feedbackVotes: await FeedbackVote.countDocuments(),
      dayReflections: await DayReflection.countDocuments()
    }
    
    const totalDocuments = Object.values(stats).reduce((a, b) => a + b, 0)
    
    return {
      collections: stats,
      totalDocuments
    }
  } catch (error) {
    return {
      collections: {},
      totalDocuments: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function getBackupStorageStats() {
  try {
    const totalBackups = await BackupMetadata.countDocuments()
    const completedBackups = await BackupMetadata.countDocuments({ status: 'completed' })
    const failedBackups = await BackupMetadata.countDocuments({ status: 'failed' })
    
    // Calculate total storage used
    const backupsWithSize = await BackupMetadata.find({ 
      status: 'completed',
      backupSize: { $exists: true, $gt: 0 }
    })
    
    const totalSize = backupsWithSize.reduce((sum, backup) => sum + (backup.backupSize || 0), 0)
    
    return {
      totalBackups,
      completedBackups,
      failedBackups,
      totalStorageUsed: formatBytes(totalSize),
      totalStorageBytes: totalSize
    }
  } catch (error) {
    return {
      totalBackups: 0,
      completedBackups: 0,
      failedBackups: 0,
      totalStorageUsed: '0 B',
      totalStorageBytes: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 