'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link as LinkIcon, MoreVertical, Trash2, X, Check, Globe, Loader2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface CommunityLink {
  id: string
  created_at: string
  user_id: string
  name: string
  url: string
  author_name: string
}

interface CommunityLinksProps {
  currentUserId: string
  currentAuthorName: string
  initialLinks?: CommunityLink[]
}

export default function CommunityLinks({
  currentUserId,
  currentAuthorName,
  initialLinks = [],
}: CommunityLinksProps) {
  const [links, setLinks] = useState<CommunityLink[]>(initialLinks)
  const [urlName, setUrlName] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Details Modal State (triggered by 3 dots)
  const [selectedLink, setSelectedLink] = useState<CommunityLink | null>(null)

  // Delete Confirmation Modal State
  const [linkToDelete, setLinkToDelete] = useState<CommunityLink | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  // Format URL to guarantee https:// (or http://)
  const formatUrl = (input: string): string => {
    const trimmed = input.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }
    return `https://${trimmed}`
  }

  // Fetch all community links
  const fetchLinks = useCallback(async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('community_links')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchErr) {
        console.error('Error fetching community links:', fetchErr)
      } else if (data) {
        setLinks(data as CommunityLink[])
      }
    } catch (err) {
      console.error('Failed to load community links:', err)
    }
  }, [supabase])

  useEffect(() => {
    if (initialLinks.length === 0) {
      fetchLinks()
    }
  }, [initialLinks.length, fetchLinks])

  // Handle Adding New Link
  const handleAddLink = async () => {
    setError(null)
    const trimmedName = urlName.trim()
    const rawUrl = urlInput.trim()

    if (!trimmedName) {
      setError('Please provide a URL Name.')
      return
    }

    if (!rawUrl) {
      setError('Please provide a URL.')
      return
    }

    const formattedUrl = formatUrl(rawUrl)
    setSubmitting(true)

    try {
      const { data, error: insertError } = await supabase
        .from('community_links')
        .insert({
          name: trimmedName,
          url: formattedUrl,
          user_id: currentUserId,
          author_name: currentAuthorName || 'Brother',
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message || 'Failed to add link.')
      } else if (data) {
        setLinks((prev) => [data as CommunityLink, ...prev])
        setUrlName('')
        setUrlInput('')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Deleting Link
  const confirmDelete = async () => {
    if (!linkToDelete) return
    setDeleting(true)
    try {
      const { error: delErr } = await supabase
        .from('community_links')
        .delete()
        .eq('id', linkToDelete.id)

      if (delErr) {
        alert(`Failed to delete link: ${delErr.message}`)
      } else {
        setLinks((prev) => prev.filter((item) => item.id !== linkToDelete.id))
        setLinkToDelete(null)
        setSelectedLink(null)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Error deleting link: ${message}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-red-700 dark:text-red-500" />
          Community Links
        </h2>

        {/* Link List */}
        <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {links.length > 0 ? (
            links.map((link) => (
              <li
                key={link.id}
                className="group flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-red-700 dark:hover:text-red-400 transition-colors truncate flex-1 min-w-0"
                  title={link.url}
                >
                  <LinkIcon className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors" />
                  <span className="truncate">{link.name}</span>
                </a>

                {/* 3 Dots Button */}
                <button
                  type="button"
                  onClick={() => setSelectedLink(link)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  aria-label={`Details for ${link.name}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-400 dark:text-gray-500 py-3 text-center italic">
              No community links added yet. Be the first to share one!
            </li>
          )}
        </ul>
      </div>

      {/* Input Section at the Bottom */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
        <div className="space-y-2">
          <div>
            <input
              type="text"
              placeholder="URL Name (e.g. Test Bank)"
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
              disabled={submitting}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="URL (e.g. drive.google.com/...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddLink()
                }
              }}
              disabled={submitting}
              className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
            />

            {/* Checkbox Submit Button */}
            <button
              type="button"
              onClick={handleAddLink}
              disabled={submitting || !urlName.trim() || !urlInput.trim()}
              title="Submit Link"
              aria-label="Submit Link"
              className="p-2.5 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-sm active:scale-95 flex items-center justify-center flex-shrink-0"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* 3-Dots Details Modal */}
      {selectedLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 relative">
            <button
              type="button"
              onClick={() => setSelectedLink(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pr-6 flex items-center gap-2">
              <Globe className="h-5 w-5 text-red-700 dark:text-red-500 flex-shrink-0" />
              Link Details
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  URL Name
                </span>
                <p className="text-gray-900 dark:text-gray-100 font-medium bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  {selectedLink.name}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  URL (Plain Text)
                </span>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-xs break-all bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 select-all">
                  {selectedLink.url}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Added By
                </span>
                <p className="text-gray-900 dark:text-gray-100 flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{selectedLink.author_name || 'Member'}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <a
                href={selectedLink.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
              >
                Open Link &rarr;
              </a>

              <button
                type="button"
                onClick={() => setLinkToDelete(selectedLink)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors border border-red-200 dark:border-red-900/30"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {linkToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6" />
            </div>

            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Delete this community link?
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-700 dark:text-gray-200">&ldquo;{linkToDelete.name}&rdquo;</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setLinkToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
