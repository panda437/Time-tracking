import mongoose, { Schema, Document } from 'mongoose'

// User Model
export interface IUser extends Document {
  _id: string
  email: string
  password?: string  // Make password optional for OAuth users
  name?: string
  timezone: string
  timeCategories?: string[] // User's custom time tracking categories
  hasCompletedOnboarding?: boolean // Whether user has completed onboarding
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Allow empty password for OAuth users
  name: { type: String },
  timezone: { type: String, default: "UTC" },
  timeCategories: { type: [String], default: ["Work", "Personal", "Health", "Education", "Social", "Fun", "Side Project", "Other"] },
  hasCompletedOnboarding: { type: Boolean, default: false },
}, {
  timestamps: true
})

// TimeEntry Model
export interface ITimeEntry extends Document {
  _id: string
  userId: string
  activity: string
  description?: string
  duration: number
  startTime: Date
  endTime: Date
  date: Date
  category: string
  mood?: string
  tags: string
  createdAt: Date
  updatedAt: Date
}

const TimeEntrySchema = new Schema<ITimeEntry>({
  userId: { type: String, required: true, index: true },
  activity: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  date: { type: Date, required: true, index: true },
  category: { type: String, default: "general", index: true },
  mood: { type: String },
  tags: { type: String, default: "" },
}, {
  timestamps: true
})

// Compound indexes
TimeEntrySchema.index({ userId: 1, date: 1 })
TimeEntrySchema.index({ userId: 1, startTime: 1 })
TimeEntrySchema.index({ userId: 1, category: 1 })

// UserGoal Model - Enhanced for SMART Goals
export interface IUserGoal extends Document {
  _id: string
  userId: string
  goal: string // Original goal name for backward compatibility
  
  // SMART Goal Extensions
  specificGoal?: string // What exactly will be accomplished?
  measurableOutcome?: string // How will you measure success?
  targetValue?: number // Target number (e.g., $500, 15kg, 50 customers)
  currentValue?: number // Current progress toward target
  unit?: string // Unit of measurement (e.g., "dollars", "kg", "customers", "pages")
  deadline?: Date // When should this be achieved?
  
  // Category & Activity Mapping
  relatedCategories?: string[] // Which time entry categories count toward this goal
  specificActivities?: string[] // Specific activities that count (e.g., "React development", "Morning jog")
  excludedActivities?: string[] // Activities that don't count (e.g., "Social media" for Focus goal)
  
  // Goal Type & Templates
  goalType?: 'financial' | 'health' | 'learning' | 'productivity' | 'relationship' | 'habit' | 'project' | 'other'
  isRefined?: boolean // Whether this goal has been refined into SMART format
  
  // Progress Tracking
  milestones?: Array<{
    description: string
    targetValue: number
    targetDate: Date
    completed: boolean
    completedDate?: Date
  }>
  
  // Goal Status
  isActive: boolean
  isArchived: boolean
  isCompleted: boolean
  completedAt?: Date
  archivedAt?: Date
  
  createdAt: Date
  updatedAt: Date
}

const UserGoalSchema = new Schema<IUserGoal>({
  userId: { type: String, required: true, index: true },
  goal: { type: String, required: true },
  
  // SMART Goal Extensions
  specificGoal: { type: String },
  measurableOutcome: { type: String },
  targetValue: { type: Number },
  currentValue: { type: Number, default: 0 },
  unit: { type: String },
  deadline: { type: Date },
  
  // Category & Activity Mapping
  relatedCategories: [{ type: String }],
  specificActivities: [{ type: String }],
  excludedActivities: [{ type: String }],
  
  // Goal Type & Templates
  goalType: { 
    type: String, 
    enum: ['financial', 'health', 'learning', 'productivity', 'relationship', 'habit', 'project', 'other'],
    default: 'other'
  },
  isRefined: { type: Boolean, default: false },
  
  // Progress Tracking
  milestones: [{
    description: { type: String, required: true },
    targetValue: { type: Number, required: true },
    targetDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    completedDate: { type: Date }
  }],
  
  // Goal Status
  isActive: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  archivedAt: { type: Date },
}, {
  timestamps: true
})

// Feedback Model
export interface IFeedback extends Document {
  _id: string
  userId: string
  title: string
  description?: string
  upVotes: number
  downVotes: number
  createdAt: Date
  updatedAt: Date
}

const FeedbackSchema = new Schema<IFeedback>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  upVotes: { type: Number, default: 0 },
  downVotes: { type: Number, default: 0 },
}, {
  timestamps: true
})

// FeedbackVote Model
export interface IFeedbackVote extends Document {
  _id: string
  userId: string
  feedbackId: string
  isUpvote: boolean
  createdAt: Date
}

const FeedbackVoteSchema = new Schema<IFeedbackVote>({
  userId: { type: String, required: true },
  feedbackId: { type: String, required: true },
  isUpvote: { type: Boolean, required: true },
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Compound unique index for user-feedback combination
FeedbackVoteSchema.index({ userId: 1, feedbackId: 1 }, { unique: true })
FeedbackVoteSchema.index({ feedbackId: 1 })

// DayReflection Model
export interface IDayReflection extends Document {
  _id: string
  userId: string
  date: Date
  reflection: string
  rating: number
  highlights: string[]
  improvements: string[]
  gratitude: string
  createdAt: Date
  updatedAt: Date
}

const DayReflectionSchema = new Schema<IDayReflection>({
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  reflection: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 10 },
  highlights: [{ type: String }],
  improvements: [{ type: String }],
  gratitude: { type: String, default: "" },
}, {
  timestamps: true
})

// Compound unique index for user-date combination
DayReflectionSchema.index({ userId: 1, date: 1 }, { unique: true })

// Backup Models
export interface IBackupMetadata extends Document {
  _id: string
  backupId: string
  type: 'manual' | 'automated'
  status: 'in_progress' | 'completed' | 'failed'
  collections: {
    [collectionName: string]: {
      status: 'success' | 'failed'
      count: number
      error?: string
    }
  }
  totalDocuments: number
  backupSize: number
  startTime: Date
  endTime?: Date
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface IBackupData extends Document {
  _id: string
  backupId: string
  collectionName: string
  data: any[]
  createdAt: Date
}

const BackupMetadataSchema = new Schema<IBackupMetadata>({
  backupId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['manual', 'automated'], required: true },
  status: { type: String, enum: ['in_progress', 'completed', 'failed'], required: true, default: 'in_progress' },
  collections: { type: Schema.Types.Mixed, default: {} },
  totalDocuments: { type: Number, default: 0 },
  backupSize: { type: Number, default: 0 },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date },
  error: { type: String },
}, {
  timestamps: true
})

const BackupDataSchema = new Schema<IBackupData>({
  backupId: { type: String, required: true, index: true },
  collectionName: { type: String, required: true },
  data: [{ type: Schema.Types.Mixed }],
}, {
  timestamps: true
})

// AI Insights Model
export interface IAIInsight extends Document {
  _id: string
  userId: string
  analysisType: 'goal_analysis' | 'schedule_suggestion'
  aiModel: string
  modelVersion: string
  analysis: any // The full AI response
  userContext: {
    goals: any[]
    recentEntries: any[]
    recentReflections: any[]
    patterns?: any
    dataPoints: {
      totalEntries: number
      totalGoals: number
      reflections: number
      hasPatterns: boolean
    }
  }
  processingTime: number // in milliseconds
  tokensUsed?: number
  cost?: number
  createdAt: Date
  updatedAt: Date
}

const AIInsightSchema = new Schema<IAIInsight>({
  userId: { type: String, required: true, index: true },
  analysisType: { 
    type: String, 
    enum: ['goal_analysis', 'schedule_suggestion'], 
    required: true 
  },
  aiModel: { type: String, required: true },
  modelVersion: { type: String, required: true },
  analysis: { type: Schema.Types.Mixed, required: true },
  userContext: {
    goals: [{ type: Schema.Types.Mixed }],
    recentEntries: [{ type: Schema.Types.Mixed }],
    recentReflections: [{ type: Schema.Types.Mixed }],
    patterns: { type: Schema.Types.Mixed },
    dataPoints: {
      totalEntries: { type: Number, required: true },
      totalGoals: { type: Number, required: true },
      reflections: { type: Number, required: true },
      hasPatterns: { type: Boolean, required: true }
    }
  },
  processingTime: { type: Number, required: true },
  tokensUsed: { type: Number },
  cost: { type: Number },
}, {
  timestamps: true
})

// Indexes for AI insights
AIInsightSchema.index({ userId: 1, createdAt: -1 })
AIInsightSchema.index({ analysisType: 1, createdAt: -1 })
AIInsightSchema.index({ aiModel: 1, createdAt: -1 })

// Indexes for backup collections
BackupMetadataSchema.index({ createdAt: -1 })
BackupMetadataSchema.index({ type: 1, status: 1 })
BackupDataSchema.index({ backupId: 1, collectionName: 1 })

// Export models
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export const TimeEntry = mongoose.models.TimeEntry || mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema)
export const UserGoal = mongoose.models.UserGoal || mongoose.model<IUserGoal>('UserGoal', UserGoalSchema)
export const Feedback = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema)
export const FeedbackVote = mongoose.models.FeedbackVote || mongoose.model<IFeedbackVote>('FeedbackVote', FeedbackVoteSchema)
export const DayReflection = mongoose.models.DayReflection || mongoose.model<IDayReflection>('DayReflection', DayReflectionSchema)
export const AIInsight = mongoose.models.AIInsight || mongoose.model<IAIInsight>('AIInsight', AIInsightSchema)
export const BackupMetadata = mongoose.models.BackupMetadata || mongoose.model<IBackupMetadata>('BackupMetadata', BackupMetadataSchema)
export const BackupData = mongoose.models.BackupData || mongoose.model<IBackupData>('BackupData', BackupDataSchema) 