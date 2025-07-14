import nodemailer from 'nodemailer'

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn('Email configuration missing. Email notifications will be disabled.')
      return null
    }
    
    transporter = nodemailer.createTransport(EMAIL_CONFIG)
  }
  return transporter
}

// Email templates
export const EmailTemplates = {
  newUserSignup: (userEmail: string, userName: string | null, signupMethod: 'google' | 'credentials') => ({
    subject: '🎉 New User Signup - TimeTrack',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF385C 0%, #E31C5F 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
            🎉 New User Joined TimeTrack!
          </h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #222; margin-top: 0; font-size: 20px;">User Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Email:</td>
              <td style="padding: 8px 0; color: #222;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Name:</td>
              <td style="padding: 8px 0; color: #222;">${userName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Signup Method:</td>
              <td style="padding: 8px 0; color: #222;">
                ${signupMethod === 'google' ? '🔗 Google OAuth' : '📧 Email/Password'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Signup Time:</td>
              <td style="padding: 8px 0; color: #222;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #00A699;">
          <p style="margin: 0; color: #1a5f1a; font-weight: 500;">
            🚀 Your TimeTrack user base is growing! This user can now start tracking their time and building better habits.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>TimeTrack Admin Notification System</p>
          <p>Generated at ${new Date().toISOString()}</p>
        </div>
      </div>
    `,
    text: `
New User Signup - TimeTrack

A new user has signed up for TimeTrack!

User Details:
- Email: ${userEmail}
- Name: ${userName || 'Not provided'}
- Signup Method: ${signupMethod === 'google' ? 'Google OAuth' : 'Email/Password'}
- Signup Time: ${new Date().toLocaleString()}

Your TimeTrack user base is growing!

TimeTrack Admin Notification
Generated at ${new Date().toISOString()}
    `
  }),

  backupFailure: (backupId: string, error: string, timestamp: Date) => ({
    subject: '🚨 CRITICAL: TimeTrack Backup Failed',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
            🚨 BACKUP FAILURE ALERT
          </h1>
        </div>
        
        <div style="background: #fff3cd; padding: 25px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
          <h2 style="color: #856404; margin-top: 0; font-size: 20px;">⚠️ Critical Issue Detected</h2>
          <p style="color: #856404; margin: 0; font-size: 16px;">
            The automated backup for TimeTrack has failed. Immediate attention required to ensure data protection.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #222; margin-top: 0; font-size: 18px;">Failure Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Backup ID:</td>
              <td style="padding: 8px 0; color: #222; font-family: monospace;">${backupId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Failure Time:</td>
              <td style="padding: 8px 0; color: #222;">${timestamp.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500; vertical-align: top;">Error Details:</td>
              <td style="padding: 8px 0; color: #dc3545; font-family: monospace; word-break: break-word;">${error}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h3 style="color: #721c24; margin-top: 0; font-size: 16px;">🔧 Immediate Actions Required</h3>
          <ol style="color: #721c24; margin: 10px 0 0 20px; padding: 0;">
            <li>Check backup status dashboard immediately</li>
            <li>Verify database connectivity and permissions</li>
            <li>Review Vercel function logs for detailed errors</li>
            <li>Create manual backup if possible</li>
            <li>Contact support if issue persists</li>
          </ol>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>TimeTrack Backup Monitoring System</p>
          <p>This is an automated alert - please respond immediately</p>
        </div>
      </div>
    `,
    text: `
CRITICAL: TimeTrack Backup Failed

The automated backup for TimeTrack has failed. Immediate attention required.

Failure Details:
- Backup ID: ${backupId}
- Failure Time: ${timestamp.toLocaleString()}
- Error: ${error}

Immediate Actions Required:
1. Check backup status dashboard immediately
2. Verify database connectivity and permissions  
3. Review Vercel function logs for detailed errors
4. Create manual backup if possible
5. Contact support if issue persists

TimeTrack Backup Monitoring System
This is an automated alert - please respond immediately
    `
  }),

  backupSuccess: (backupId: string, stats: any, timestamp: Date) => ({
    subject: '✅ TimeTrack Backup Completed Successfully',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
            ✅ Backup Completed Successfully
          </h1>
        </div>
        
        <div style="background: #d4edda; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
          <h2 style="color: #155724; margin-top: 0; font-size: 20px;">🛡️ Your Data is Protected</h2>
          <p style="color: #155724; margin: 0; font-size: 16px;">
            The automated backup has completed successfully. All your TimeTrack data is safely backed up.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #222; margin-top: 0; font-size: 18px;">Backup Statistics</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Backup ID:</td>
              <td style="padding: 8px 0; color: #222; font-family: monospace;">${backupId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Completion Time:</td>
              <td style="padding: 8px 0; color: #222;">${timestamp.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Total Documents:</td>
              <td style="padding: 8px 0; color: #222;">${stats.totalDocuments?.toLocaleString() || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Backup Size:</td>
              <td style="padding: 8px 0; color: #222;">${formatBytes(stats.backupSize || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 500;">Duration:</td>
              <td style="padding: 8px 0; color: #222;">${Math.round((stats.duration || 0) / 1000)}s</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>TimeTrack Backup Monitoring System</p>
          <p>Next backup scheduled for tomorrow at 2:00 AM UTC</p>
        </div>
      </div>
    `,
    text: `
TimeTrack Backup Completed Successfully

Your automated backup has completed successfully.

Backup Statistics:
- Backup ID: ${backupId}
- Completion Time: ${timestamp.toLocaleString()}
- Total Documents: ${stats.totalDocuments?.toLocaleString() || 'N/A'}
- Backup Size: ${formatBytes(stats.backupSize || 0)}
- Duration: ${Math.round((stats.duration || 0) / 1000)}s

Your data is protected!

TimeTrack Backup Monitoring System
Next backup scheduled for tomorrow at 2:00 AM UTC
    `
  }),

  weeklyBackupSummary: (weeklyStats: any) => ({
    subject: '📊 Weekly Backup Summary - TimeTrack',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
            📊 Weekly Backup Summary
          </h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #222; margin-top: 0; font-size: 20px;">This Week's Performance</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #28a745;">${weeklyStats.successfulBackups || 0}</div>
              <div style="color: #666; font-size: 14px;">Successful Backups</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: ${weeklyStats.failedBackups > 0 ? '#dc3545' : '#28a745'};">${weeklyStats.failedBackups || 0}</div>
              <div style="color: #666; font-size: 14px;">Failed Backups</div>
            </div>
          </div>
        </div>
        
        <div style="background: ${weeklyStats.successRate >= 95 ? '#d4edda' : weeklyStats.successRate >= 80 ? '#fff3cd' : '#f8d7da'}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: ${weeklyStats.successRate >= 95 ? '#155724' : weeklyStats.successRate >= 80 ? '#856404' : '#721c24'}; margin-top: 0; font-size: 16px;">
            Overall Success Rate: ${weeklyStats.successRate || 0}%
          </h3>
          <p style="color: ${weeklyStats.successRate >= 95 ? '#155724' : weeklyStats.successRate >= 80 ? '#856404' : '#721c24'}; margin: 0;">
            ${weeklyStats.successRate >= 95 ? '🎉 Excellent! Your backup system is performing optimally.' : 
              weeklyStats.successRate >= 80 ? '⚠️ Good, but there may be room for improvement.' : 
              '🚨 Attention needed: Multiple backup failures detected.'}
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>TimeTrack Weekly Backup Report</p>
          <p>Generated ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `,
    text: `
Weekly Backup Summary - TimeTrack

This Week's Performance:
- Successful Backups: ${weeklyStats.successfulBackups || 0}
- Failed Backups: ${weeklyStats.failedBackups || 0}
- Success Rate: ${weeklyStats.successRate || 0}%

${weeklyStats.successRate >= 95 ? 'Excellent! Your backup system is performing optimally.' : 
  weeklyStats.successRate >= 80 ? 'Good, but there may be room for improvement.' : 
  'Attention needed: Multiple backup failures detected.'}

TimeTrack Weekly Backup Report
Generated ${new Date().toLocaleDateString()}
    `
  })
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Main email sending function
export async function sendEmail(to: string, template: { subject: string; html: string; text: string }) {
  const emailTransporter = getTransporter()
  
  if (!emailTransporter) {
    console.warn('Email transporter not configured. Skipping email notification.')
    return { success: false, error: 'Email not configured' }
  }

  if (!FROM_EMAIL) {
    console.warn('FROM_EMAIL not configured. Skipping email notification.')
    return { success: false, error: 'FROM_EMAIL not configured' }
  }

  try {
    const mailOptions = {
      from: `"TimeTrack" <${FROM_EMAIL}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }

    const result = await emailTransporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', { to, subject: template.subject, messageId: result.messageId })
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Convenience functions for specific notifications
export async function sendNewUserNotification(userEmail: string, userName: string | null, signupMethod: 'google' | 'credentials') {
  if (!ADMIN_EMAIL) {
    console.warn('ADMIN_EMAIL not configured. Skipping new user notification.')
    return { success: false, error: 'ADMIN_EMAIL not configured' }
  }

  const template = EmailTemplates.newUserSignup(userEmail, userName, signupMethod)
  return await sendEmail(ADMIN_EMAIL, template)
}

export async function sendBackupFailureNotification(backupId: string, error: string) {
  if (!ADMIN_EMAIL) {
    console.warn('ADMIN_EMAIL not configured. Skipping backup failure notification.')
    return { success: false, error: 'ADMIN_EMAIL not configured' }
  }

  const template = EmailTemplates.backupFailure(backupId, error, new Date())
  return await sendEmail(ADMIN_EMAIL, template)
}

export async function sendBackupSuccessNotification(backupId: string, stats: any) {
  if (!ADMIN_EMAIL) {
    console.warn('ADMIN_EMAIL not configured. Skipping backup success notification.')
    return { success: false, error: 'ADMIN_EMAIL not configured' }
  }

  const template = EmailTemplates.backupSuccess(backupId, stats, new Date())
  return await sendEmail(ADMIN_EMAIL, template)
}

export async function sendWeeklyBackupSummary(weeklyStats: any) {
  if (!ADMIN_EMAIL) {
    console.warn('ADMIN_EMAIL not configured. Skipping weekly backup summary.')
    return { success: false, error: 'ADMIN_EMAIL not configured' }
  }

  const template = EmailTemplates.weeklyBackupSummary(weeklyStats)
  return await sendEmail(ADMIN_EMAIL, template)
}

// Test email configuration
export async function testEmailConfiguration() {
  const emailTransporter = getTransporter()
  
  if (!emailTransporter) {
    return { success: false, error: 'Email transporter not configured' }
  }

  try {
    await emailTransporter.verify()
    return { success: true, message: 'Email configuration is valid' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
} 