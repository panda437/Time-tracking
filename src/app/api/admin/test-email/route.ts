import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { testEmailConfiguration, sendEmail, EmailTemplates } from "@/lib/email"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Check if user is admin
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    // Test email configuration
    const configTest = await testEmailConfiguration()
    
    if (!configTest.success) {
      return NextResponse.json({
        success: false,
        error: "Email configuration test failed",
        details: configTest.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Email configuration is valid",
      config: {
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: process.env.SMTP_PORT || '587',
        fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER,
        adminEmail: process.env.ADMIN_EMAIL,
        hasSmtpUser: !!process.env.SMTP_USER,
        hasSmtpPassword: !!process.env.SMTP_PASSWORD
      }
    })

  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Email test failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Check if user is admin
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const { type = 'test' } = await request.json()

    let emailResult

    switch (type) {
      case 'new_user':
        emailResult = await sendEmail(
          process.env.ADMIN_EMAIL!,
          EmailTemplates.newUserSignup('test@example.com', 'Test User', 'credentials')
        )
        break
      
      case 'backup_success':
        emailResult = await sendEmail(
          process.env.ADMIN_EMAIL!,
          EmailTemplates.backupSuccess('test-backup-123', {
            totalDocuments: 1500,
            backupSize: 2048000,
            duration: 15000
          }, new Date())
        )
        break
      
      case 'backup_failure':
        emailResult = await sendEmail(
          process.env.ADMIN_EMAIL!,
          EmailTemplates.backupFailure('test-backup-456', 'Database connection timeout', new Date())
        )
        break
      
      case 'weekly_summary':
        emailResult = await sendEmail(
          process.env.ADMIN_EMAIL!,
          EmailTemplates.weeklyBackupSummary({
            successfulBackups: 6,
            failedBackups: 1,
            successRate: 85.7
          })
        )
        break
      
      default:
        // Send basic test email
        emailResult = await sendEmail(process.env.ADMIN_EMAIL!, {
          subject: '✅ TimeTrack Email Test',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #FF385C 0%, #E31C5F 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
                  ✅ Email Test Successful!
                </h1>
              </div>
              
              <div style="background: #d4edda; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                <h2 style="color: #155724; margin-top: 0; font-size: 20px;">🎉 Great News!</h2>
                <p style="color: #155724; margin: 0; font-size: 16px;">
                  Your TimeTrack email system is working perfectly. You'll now receive notifications for new user signups and backup status updates.
                </p>
              </div>
              
              <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #222; margin-top: 0; font-size: 18px;">Test Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 500;">Test Time:</td>
                    <td style="padding: 8px 0; color: #222;">${new Date().toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 500;">Admin Email:</td>
                    <td style="padding: 8px 0; color: #222;">${process.env.ADMIN_EMAIL}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 500;">SMTP Host:</td>
                    <td style="padding: 8px 0; color: #222;">${process.env.SMTP_HOST || 'smtp.gmail.com'}</td>
                  </tr>
                </table>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                <p>TimeTrack Email Test System</p>
                <p>Generated at ${new Date().toISOString()}</p>
              </div>
            </div>
          `,
          text: `
TimeTrack Email Test Successful!

Your TimeTrack email system is working perfectly.

Test Details:
- Test Time: ${new Date().toLocaleString()}
- Admin Email: ${process.env.ADMIN_EMAIL}
- SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}

TimeTrack Email Test System
Generated at ${new Date().toISOString()}
          `
        })
    }

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: "Failed to send test email",
        details: emailResult.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully (${type})`,
      messageId: emailResult.messageId
    })

  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Test email failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
} 