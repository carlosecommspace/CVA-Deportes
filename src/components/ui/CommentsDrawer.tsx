'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send, MessageCircle, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string }
}

interface CommentsDrawerProps {
  title: string
  apiPath: string   // e.g. '/api/requirements/abc/comments'
  canComment: boolean
  onClose: () => void
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function CommentsDrawer({ title, apiPath, canComment, onClose }: CommentsDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(apiPath)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data)
      })
      .finally(() => setLoading(false))
  }, [apiPath])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (res.ok) {
        const comment: Comment = await res.json()
        setComments((prev) => [...prev, comment])
        setContent('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <MessageCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Comentarios</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageCircle className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Aún no hay comentarios</p>
              {canComment && (
                <p className="text-xs text-gray-300 mt-1">Sé el primero en comentar</p>
              )}
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {initials(comment.user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-gray-800">{comment.user.name}</span>
                    <span className="text-[11px] text-gray-400">{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-100 px-5 py-4">
          {canComment ? (
            <div className="flex gap-2 items-end">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí un comentario... (Ctrl+Enter para enviar)"
                rows={3}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400"
              />
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                title="Enviar (Ctrl+Enter)"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">
              Tu rol no tiene permisos para comentar
            </p>
          )}
        </div>
      </div>
    </>
  )
}
