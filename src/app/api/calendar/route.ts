import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { TimeEntry, ITimeEntry } from "@/lib/models"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from "date-fns"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const view = searchParams.get("view") || "month" // month, week
  const date = searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date()
  
  let startDate: Date
  let endDate: Date
  
  if (view === "month") {
    startDate = startOfMonth(date)
    endDate = endOfMonth(date)
  } else if (view === "week") {
    startDate = startOfWeek(date, { weekStartsOn: 1 })
    endDate = endOfWeek(date, { weekStartsOn: 1 })
  } else {
    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 })
  }

  try {
    await connectDB()
    
    // Get entries for the period
    const entries = await TimeEntry.find({
      userId: session.user.id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1, startTime: 1 })

    // Group entries by date for calendar display
    const groupedByDate = entries.reduce((acc, entry) => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd')
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          entries: [],
          totalDuration: 0,
          categories: new Set<string>()
        }
      }
      
      acc[dateKey].entries.push(entry)
      acc[dateKey].totalDuration += entry.duration
      acc[dateKey].categories.add(entry.category)
      
      return acc
    }, {} as Record<string, {
      date: string
      entries: ITimeEntry[]
      totalDuration: number
      categories: Set<string>
    }>)

    // Convert categories Set to Array for JSON serialization
    type GroupedDayType = {
      date: string
      entries: ITimeEntry[]
      totalDuration: number
      categories: Set<string>
    }
    
    const calendarData = (Object.values(groupedByDate) as GroupedDayType[]).map(day => ({
      date: day.date,
      entries: day.entries,
      totalDuration: day.totalDuration,
      categories: Array.from(day.categories)
    }))

    // Get summary stats for the period
    const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0)
    const categorySummary = entries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.duration
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      view,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      days: calendarData,
      summary: {
        totalDuration,
        totalEntries: entries.length,
        categories: categorySummary,
        averageDailyDuration: Math.round(totalDuration / ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      }
    })
  } catch (error) {
    console.error("Calendar API error:", error)
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 })
  }
}
