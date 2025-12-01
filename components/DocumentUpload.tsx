'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, File, X, Loader2 } from 'lucide-react'
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      for (const file of files) {
        // Upload to Supabase Storage
        const filePath = `${user.id}/${noteId}/${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Save document metadata
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            note_id: noteId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type
          })

        if (dbError) throw dbError

        // Trigger AI extraction
        await fetch('/api/extract-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath, noteId })
        })
      }

      setFiles([])
      onUploadComplete?.()
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <h3 className="font-semibold text-sm">Attach Documents</h3>
      
      <div className="flex items-center gap-2">
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".pdf,.txt,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
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
