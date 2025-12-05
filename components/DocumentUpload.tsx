'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, File, X, Loader2, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface DocumentUploadProps {
  noteId: string
  onUploadComplete?: () => void
}

export const DocumentUpload = ({ noteId, onUploadComplete }: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }
      
      if (!user) {
        throw new Error('Not authenticated. Please sign in first.')
      }

      console.log('✅ User authenticated:', user.id)

      for (const file of files) {
        console.log(`📤 Uploading file: ${file.name} (${file.size} bytes)`)
        
        // Upload to Supabase Storage with unique filename
        const timestamp = Date.now()
        const fileExt = file.name.split('.').pop()
        const filePath = `${user.id}/${noteId}/${timestamp}.${fileExt}`
        
        console.log(`📁 Storage path: ${filePath}`)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw new Error(`Storage upload failed: ${uploadError.message}`)
        }

        console.log('✅ File uploaded to storage:', uploadData)

        // Save document metadata
        const { data: dbData, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            note_id: noteId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size
          })
          .select()

        if (dbError) {
          console.error('Database insert error:', dbError)
          throw new Error(`Database error: ${dbError.message}`)
        }

        console.log('✅ Document metadata saved:', dbData)

        // Trigger AI extraction using Edge Function
        console.log('🤖 Starting AI extraction...')
        const { data: { session } } = await supabase.auth.getSession()
        
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/extract-document`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ filePath, noteId })
        })
          .then(async (response) => {
            if (!response.ok) {
              console.error('❌ AI extraction failed with status:', response.status)
              try {
                const error = await response.json()
                console.error('Error details:', error)
              } catch (e) {
                const text = await response.text()
                console.error('Error response (not JSON):', text.substring(0, 200))
              }
              return
            }
            const result = await response.json()
            console.log('✅ AI extraction completed:', result)
            
            // Trigger refresh after AI completes
            setTimeout(() => {
              onUploadComplete?.()
            }, 500)
          })
          .catch(err => {
            console.error('❌ AI extraction error:', err)
          })
      }

      setFiles([])
      console.log('✅ All documents uploaded successfully')
      onUploadComplete?.()
    } catch (error: any) {
      console.error('Upload failed:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      alert(`Upload failed: ${errorMessage}\n\nPlease check:\n1. You are signed in\n2. Storage bucket exists\n3. RLS policies are configured`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">Attach Documents</h3>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="h-3 w-3" />
          AI Powered
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Upload text files (.txt, .md, .json, .csv). AI automatically extracts summaries, key insights, and topics.
      </p>
      <p className="text-xs text-muted-foreground/70">
        📝 For PDFs: Convert to .txt first, or they'll be stored without AI analysis.
      </p>
      
      <div className="flex items-center gap-2">
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".txt,.md,.json,.csv,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          title="Best: .txt, .md, .json, .csv | Stored only: .pdf, .doc, .docx"
        />
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            asChild
          >
            <span>
              <Upload className="h-4 w-4" />
              Choose Files
            </span>
          </Button>
        </label>
        
        {files.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            size="sm"
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>Upload {files.length} file(s)</>
            )}
          </Button>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-2">
              <File className="h-4 w-4" />
              <span className="flex-1 truncate">{file.name}</span>
              <button
                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
