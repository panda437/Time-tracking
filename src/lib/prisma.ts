import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

interface MongooseConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseConnection
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
global.mongoose = global.mongoose || { conn: null, promise: null }

async function connectDB() {
  if (global.mongoose.conn) {
    return global.mongoose.conn
  }

  if (!global.mongoose.promise) {
    const opts = {
      bufferCommands: false,
    }

    global.mongoose.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    global.mongoose.conn = await global.mongoose.promise
  } catch (e) {
    global.mongoose.promise = null
    throw e
  }

  return global.mongoose.conn
}

export default connectDB
