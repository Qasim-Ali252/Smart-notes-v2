import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/store/hooks'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  type: 'reminder' | 'suggestion' | 'achievement'
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
}

export const useNotifications = () => {
  const { notes } = useAppSelector((state) => state.notes)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const generateNotifications = async () => {
      const newNotifications: Notification[] = []
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || notes.length === 0) {
        setNotifications([])
        setUnreadCount(0)
        return
      }

      // 1. Check for unfinished drafts (notes with very short content)
      const drafts = notes.filter(note => 
        note.content.trim().length < 50 && 
        !note.content.includes('# ') // Not just a title
      )
      
      if (drafts.length > 0) {
        newNotifications.push({
          id: 'unfinished-drafts',
          type: 'reminder',
          title: 'Unfinished Drafts',
          message: `You have ${drafts.length} unfinished draft${drafts.length > 1 ? 's' : ''} waiting to be completed`,
          action: {
            label: 'View Drafts',
            href: '/dashboard'
          },
          priority: 'medium',
          createdAt: new Date()
        })
      }

      // 2. Check for notes without AI enrichment
      const unenrichedNotes = notes.filter(note => !note.summary)
      
      if (unenrichedNotes.length > 0) {
        newNotifications.push({
          id: 'unenriched-notes',
          type: 'suggestion',
          title: 'AI Enrichment Available',
          message: `${unenrichedNotes.length} note${unenrichedNotes.length > 1 ? 's' : ''} could benefit from AI analysis and summaries`,
          action: {
            label: 'Enrich Notes',
            href: '/dashboard'
          },
          priority: 'low',
          createdAt: new Date()
        })
      }

      // 3. Check for notes without tags
      const untaggedNotes = notes.filter(note => !note.tags || note.tags.length === 0)
      
      if (untaggedNotes.length > 3) {
        newNotifications.push({
          id: 'untagged-notes',
          type: 'suggestion',
          title: 'Organization Opportunity',
          message: `${untaggedNotes.length} notes could use tags for better organization`,
          action: {
            label: 'Add Tags',
            href: '/dashboard'
          },
          priority: 'low',
          createdAt: new Date()
        })
      }

      // 4. Check for old notes that haven't been updated
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const oldNotes = notes.filter(note => 
        new Date(note.updated_at) < oneWeekAgo &&
        note.content.length > 100 // Only consider substantial notes
      )
      
      if (oldNotes.length > 5) {
        newNotifications.push({
          id: 'old-notes',
          type: 'reminder',
          title: 'Review Old Notes',
          message: `You have ${oldNotes.length} notes that haven't been updated in a week`,
          action: {
            label: 'Review Notes',
            href: '/dashboard?filter=recent'
          },
          priority: 'low',
          createdAt: new Date()
        })
      }

      // 5. Achievement: Milestone notifications
      if (notes.length === 10) {
        newNotifications.push({
          id: 'milestone-10',
          type: 'achievement',
          title: '🎉 First 10 Notes!',
          message: 'Congratulations on creating your first 10 notes! You\'re building a great knowledge base.',
          priority: 'medium',
          createdAt: new Date()
        })
      } else if (notes.length === 50) {
        newNotifications.push({
          id: 'milestone-50',
          type: 'achievement',
          title: '🚀 50 Notes Milestone!',
          message: 'Amazing! You\'ve created 50 notes. Your digital brain is growing!',
          priority: 'high',
          createdAt: new Date()
        })
      }

      // 6. Check for notes that could be linked
      const notesWithoutLinks = notes.filter(note => 
        !note.content.includes('[[') && // No wiki-style links
        !note.content.includes('http') && // No external links
        note.content.length > 200
      )
      
      if (notesWithoutLinks.length > 5) {
        newNotifications.push({
          id: 'linking-opportunity',
          type: 'suggestion',
          title: 'Connect Your Ideas',
          message: `${notesWithoutLinks.length} notes could benefit from linking to related content`,
          action: {
            label: 'Explore Connections',
            href: '/dashboard'
          },
          priority: 'low',
          createdAt: new Date()
        })
      }

      // Sort by priority and date
      const sortedNotifications = newNotifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      setNotifications(sortedNotifications)
      setUnreadCount(sortedNotifications.length)
    }

    generateNotifications()
  }, [notes])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  }
}