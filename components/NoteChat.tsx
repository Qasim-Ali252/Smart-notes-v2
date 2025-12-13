'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2, Sparkles, Trash2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface NoteChatProps {
  noteId: string
  noteTitle: string
  noteContent: string
}

export const NoteChat = ({ noteId, noteTitle, noteContent }: NoteChatProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory()
  }, [noteId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await fetch(`/api/chat-history?noteId=${noteId}`)
      const data = await response.json()

      if (response.ok && data.chatHistory) {
        const historyMessages = data.chatHistory.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }))

        if (historyMessages.length === 0) {
          // No history, show welcome message
          setMessages([{
            role: 'assistant',
            content: `Hi! I'm your AI assistant for "${noteTitle}". Ask me anything about this note, or request improvements, summaries, or action items!`,
            timestamp: new Date()
          }])
        } else {
          setMessages(historyMessages)
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
      // Fallback to welcome message
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your AI assistant for "${noteTitle}". Ask me anything about this note, or request improvements, summaries, or action items!`,
        timestamp: new Date()
      }])
    } finally {
      setLoadingHistory(false)
    }
  }

  const saveChatHistory = async (newMessages: Message[]) => {
    try {
      // Only save messages that don't have an ID (new messages)
      const messagesToSave = newMessages.filter(msg => !msg.id)
      
      if (messagesToSave.length === 0) return

      await fetch('/api/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          messages: messagesToSave
        })
      })
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }

  const clearChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat-history?noteId=${noteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Reset to welcome message
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm your AI assistant for "${noteTitle}". Ask me anything about this note, or request improvements, summaries, or action items!`,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/note-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          noteContent,
          question: input,
          chatHistory: messages.slice(-10) // Last 10 messages for better context
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      if (!data.answer) {
        throw new Error('No answer received from AI')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date()
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)

      // Save the new messages to database
      await saveChatHistory([userMessage, assistantMessage])
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}`,
        timestamp: new Date()
      }
      const finalMessages = [...updatedMessages, errorMessage]
      setMessages(finalMessages)

      // Save the error message too
      await saveChatHistory([userMessage, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    'Summarize this note',
    'Create action items',
    'Suggest improvements',
    'Explain in simpler terms'
  ]

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
          {messages.length > 1 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {messages.length - 1} messages
            </span>
          )}
        </div>
        
        {messages.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadChatHistory}
              disabled={loadingHistory}
              className="h-8 w-8 p-0"
              title="Refresh chat"
            >
              <RotateCcw className={cn("h-3 w-3", loadingHistory && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChatHistory}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Clear chat history"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading chat history...</span>
            </div>
          ) : (
            messages.map((message, idx) => (
            <div
              key={idx}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-accent" />
                </div>
              )}
            </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => setInput(action)}
              className="text-xs"
            >
              {action}
            </Button>
          ))}
        </div>
      )}

      <div className="flex gap-2 ">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about this note..."
          className="min-h-[60px] resize-none"
          disabled={loading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          size="icon"
          className="h-[60px] w-[60px] shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>AI responses are based on this note's content and chat history</p>
        {messages.length > 1 && (
          <p className="text-green-600 dark:text-green-400">
            ✓ Chat history is automatically saved
          </p>
        )}
      </div>
    </div>
  )
}
