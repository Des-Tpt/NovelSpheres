import { Act } from '@/model/Act'
import { Chapter } from '@/model/Chapter'
import { Comment } from '@/model/Comment'
import { Genre } from '@/model/Genre'
import { Novel } from '@/model/Novel'
import { ForumPost } from '@/model/PostForum'
import { User } from '@/model/User'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
  throw new Error('⚠️ MONGODB_URI chưa được khai báo trong .env.local')
}

let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export async function connectDB(): Promise<typeof mongoose> {

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
        return mongooseInstance
      })
      .catch((error) => {
        console.error('Không thể kết nối tới DB:', error)
        cached.promise = null
        throw error
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}
