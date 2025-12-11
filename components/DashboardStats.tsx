'use client'
import { FileText, Sparkles, Calendar, TrendingUp, Star } from 'lucide-react'

interface DashboardStatsProps {
  totalNotes: number
  notesThisWeek: number
  enrichedNotes: number
  favouriteNotes: number
}

export const DashboardStats = ({ totalNotes, notesThisWeek, enrichedNotes, favouriteNotes }: DashboardStatsProps) => {
  const stats = [
    {
      label: 'Total Notes',
      value: totalNotes,
      icon: FileText,
      color: 'text-primary'
    },
    {
      label: 'This Week',
      value: notesThisWeek,
      icon: Calendar,
      color: 'text-accent'
    },
    {
      label: 'AI Enriched',
      value: enrichedNotes,
      icon: Sparkles,
      color: 'text-primary'
    },
    {
      label: 'Favourites',
      value: favouriteNotes,
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      label: 'Growth',
      value: notesThisWeek > 0 ? '+' + notesThisWeek : '0',
      icon: TrendingUp,
      color: 'text-accent'
    }
  ]

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div className="text-2xl font-bold mb-1">{stat.value}</div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
