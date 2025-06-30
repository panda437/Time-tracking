import mongoose, { Schema, Document } from 'mongoose'

// User Model
export interface IUser extends Document {
  _id: string
  email: string
  password?: string  // Make password optional for OAuth users
  name?: string
  timezone: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Allow empty password for OAuth users
  name: { type: String },
  timezone: { type: String, default: "UTC" },
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

// UserGoal Model
export interface IUserGoal extends Document {
  _id: string
  userId: string
  goal: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const UserGoalSchema = new Schema<IUserGoal>({
  userId: { type: String, required: true, index: true },
  goal: { type: String, required: true },
  isActive: { type: Boolean, default: true },
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

// Export models
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export const TimeEntry = mongoose.models.TimeEntry || mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema)
export const UserGoal = mongoose.models.UserGoal || mongoose.model<IUserGoal>('UserGoal', UserGoalSchema)
export const Feedback = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema)
export const FeedbackVote = mongoose.models.FeedbackVote || mongoose.model<IFeedbackVote>('FeedbackVote', FeedbackVoteSchema) 