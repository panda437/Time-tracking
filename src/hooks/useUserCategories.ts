"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useUserCategories() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<string[]>([
    "Work", "Personal", "Health", "Education", "Social", "Fun", "Side Project", "Other"
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserCategories()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchUserCategories = async () => {
    try {
      setLoading(true)
      console.log('Fetching user categories...')
      const response = await fetch('/api/user/categories', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Categories fetched:', data.categories)
        setCategories(data.categories)
      } else {
        console.error('Failed to fetch user categories')
        setError('Failed to load categories')
      }
    } catch (error) {
      console.error('Error fetching user categories:', error)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const updateCategories = async (newCategories: string[]) => {
    try {
      setLoading(true)
      console.log('Updating categories:', newCategories)
      const response = await fetch('/api/user/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ categories: newCategories }),
      })
      
      if (response.ok) {
        console.log('Categories updated successfully')
        setCategories(newCategories)
        return true
      } else {
        const errorData = await response.json()
        console.error('Failed to update categories:', errorData)
        setError(errorData.error || 'Failed to update categories')
        return false
      }
    } catch (error) {
      console.error('Error updating categories:', error)
      setError('Failed to update categories')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    categories,
    loading,
    error,
    updateCategories,
    refreshCategories: fetchUserCategories
  }
} 