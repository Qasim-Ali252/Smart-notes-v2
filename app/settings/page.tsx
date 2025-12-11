'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Upload, Trash2, User, Mail, Calendar, FileText, Heart, Clock, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState({ total: 0, favorites: 0, recent: 0 })
  const [sessions, setSessions] = useState<any[]>([])
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      setDisplayName(user.user_metadata?.display_name || '')
      setAvatarUrl(user.user_metadata?.avatar_url || '')

      // Load stats
      const { data: notes } = await supabase
        .from('notes')
        .select('id, is_favorite, created_at')
        .eq('user_id', user.id)

      if (notes) {
        const favorites = notes.filter((n: any) => n.is_favorite).length
        const recent = notes.filter((n: any) => {
          const dayAgo = new Date()
          dayAgo.setDate(dayAgo.getDate() - 1)
          return new Date(n.created_at) > dayAgo
        }).length

        setStats({ total: notes.length, favorites, recent })
      }

      // Load current session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessions([session])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return
      
      setUploading(true)
      const file = e.target.files[0]
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB')
        return
      }

      // Convert to base64 for simple storage in user metadata
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const base64String = event.target?.result as string
          
          // Update user metadata with base64 image
          const supabase = createClient()
          const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: base64String }
          })

          if (updateError) {
            console.error('Update error:', updateError)
            throw updateError
          }

          setAvatarUrl(base64String)
          alert('Profile picture updated successfully!')
        } catch (error: any) {
          console.error('Avatar update error:', error)
          alert('Error updating avatar: ' + error.message)
        } finally {
          setUploading(false)
        }
      }
      
      reader.onerror = () => {
        alert('Error reading file')
        setUploading(false)
      }
      
      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      alert('Error uploading avatar: ' + error.message)
      setUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { display_name: displayName }
      })
      alert('Profile updated successfully!')
    } catch (error: any) {
      alert('Error updating profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    
    try {
      const supabase = createClient()
      // Delete all user notes first
      await supabase.from('notes').delete().eq('user_id', user.id)
      await supabase.from('documents').delete().eq('user_id', user.id)
      
      alert('Account deletion initiated. Please contact support to complete the process.')
      await supabase.auth.signOut()
      router.push('/')
    } catch (error: any) {
      alert('Error deleting account: ' + error.message)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSwitchAccount = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile picture and display name</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload Photo'}
                      </div>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground">JPEG, JPG, PNG or GIF (max 2MB)</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(user?.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <Button onClick={handleUpdateProfile} disabled={loading}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">All your notes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.favorites}</div>
                  <p className="text-xs text-muted-foreground">Marked as favorite</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recent}</div>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
                <CardDescription>Manage your account sessions and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Sessions</Label>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSwitchAccount}>
                      Switch Account
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>

                  <div className="space-y-2">
                    <Label className="text-destructive">Danger Zone</Label>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      This will permanently delete your account and all associated data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
