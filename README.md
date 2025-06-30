# TimeTrack - Personal Time Tracking App

A beautiful, simple time tracking application built with Next.js 14, Prisma, and NextAuth.js.

## ✨ Features

- **Simple Time Entry**: Just ask "What did you do in the last half hour?" 
- **Smart Analytics**: Weekly overviews with category breakdowns and mood tracking
- **Calendar-Ready**: Optimized database structure for future calendar views
- **Multi-User**: Secure authentication with email/password
- **Beautiful UI**: Modern interface built with Tailwind CSS
- **Real-time Updates**: Instant CRUD operations for all time entries

## 🚀 Quick Deploy

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/time-track)

1. Click the deploy button above
2. Connect your GitHub account
3. Set up environment variables (see below)
4. Deploy!

### Environment Variables

Set these in your Vercel dashboard or `.env.local`:

```bash
# Database - Your PostgreSQL URL
DATABASE_URL="your-postgresql-connection-string"

# NextAuth - Generate a strong secret
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-long-random-secret-key"

# App Settings
APP_URL="https://your-domain.vercel.app"
```

## 🛠 Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/time-track.git
   cd time-track
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # For development - push schema to database
   npx prisma db push
   
   # For production - use migrations
   npx prisma migrate deploy
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 📊 Database Schema

The app uses a PostgreSQL database with optimized schema:

- **Users**: Secure user accounts with timezone support
- **TimeEntries**: Time tracking with categories, moods, and tags
- **Indexes**: Optimized for calendar queries and fast filtering

### Key Features:
- User isolation (each user only sees their data)
- Date field for fast calendar queries
- Flexible tagging system
- Mood tracking for wellness insights
- Category-based organization

### 🗄️ Database Migration Steps

For **development** (schema changes without history):
```bash
npx prisma db push
```

For **production** (proper migrations with history):
```bash
# Create a new migration
npx prisma migrate dev --name describe_your_change

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (development only - destroys data!)
npx prisma migrate reset
```

**Important**: Always use `prisma migrate deploy` in production environments, never `db push`.

## 🎯 Usage

1. **Sign up** with your email and password
2. **Add time entries** by describing what you did
3. **Review your week** with beautiful analytics
4. **Edit or delete** entries as needed
5. **Track patterns** with mood and category insights

## 🔧 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Deployment**: Vercel
- **Icons**: Lucide React

## 🔐 Security

- Secure authentication with bcrypt password hashing
- API route protection with session validation
- User data isolation at database level
- Environment variable protection
- CSRF protection through NextAuth.js

## 📱 Future Features

- 📅 Calendar view for time entries
- 📊 Advanced analytics and insights
- 🏷️ Custom tags and categories
- 📤 Data export (CSV, PDF)
- ⏰ Automatic time tracking
- 🎯 Goal setting and tracking
- 📱 Mobile app (React Native)

## 🤝 Contributing

Feel free to open issues and pull requests!

## 📄 License

MIT License - feel free to use this for your own projects!
