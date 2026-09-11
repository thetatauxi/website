'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Link as LinkIcon,
  MoreVertical,
  Trash2,
  X,
  Check,
  Globe,
  Loader2,
  User,
  Shield,
  CheckSquare,
  Send,
  Users,
  Folder,
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  Tag,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface CommunityLink {
  id: string
  created_at: string
  user_id: string
  name: string
  url: string
  author_name: string
  category?: string | null
}

interface CommunityLinksProps {
  currentUserId: string
  currentAuthorName: string
  initialLinks?: CommunityLink[]
}

const DEFAULT_CATEGORIES = ['Admin', 'Required', 'Telegram', 'Rush', 'Other']

// Helper to select an icon per category
function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const norm = category.toLowerCase().trim()
  if (norm.includes('admin')) {
    return <Shield className={className} />
  }
  if (norm.includes('require')) {
    return <CheckSquare className={className} />
  }
  if (norm.includes('telegram') || norm.includes('chat') || norm.includes('message')) {
    return <Send className={className} />
  }
  if (norm.includes('rush')) {
    return <Users className={className} />
  }
  if (norm.includes('other')) {
    return <Folder className={className} />
  }
  return <Tag className={className} />
}

export default function CommunityLinks({
  currentUserId,
  currentAuthorName,
  initialLinks = [],
}: CommunityLinksProps) {
  const [links, setLinks] = useState<CommunityLink[]>(initialLinks)
  const [urlName, setUrlName] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Other')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Expanded state map: key is category name, boolean is expanded (true = expanded, default false = collapsed)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

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

  // Derive unique categories: default categories + any custom ones found in fetched links
  const allCategories = useMemo(() => {
    const customSet = new Set<string>()
    links.forEach((l) => {
      if (l.category && !DEFAULT_CATEGORIES.includes(l.category)) {
        customSet.add(l.category)
      }
    })
    const extraCategories = Array.from(customSet).sort()
    return [
      ...DEFAULT_CATEGORIES.filter((c) => c !== 'Other'),
      ...extraCategories,
      'Other',
    ]
  }, [links])

  // Group links by category
  const groupedLinks = useMemo(() => {
    const map: Record<string, CommunityLink[]> = {}
    allCategories.forEach((cat) => {
      map[cat] = []
    })

    links.forEach((link) => {
      const cat = (link.category && link.category.trim()) || 'Other'
      if (!map[cat]) {
        map[cat] = []
      }
      map[cat].push(link)
    })

    return map
  }, [allCategories, links])

  // Expand / Condense All calculation
  const isAllExpanded = useMemo(() => {
    return allCategories.length > 0 && allCategories.every((cat) => !!expandedCategories[cat])
  }, [allCategories, expandedCategories])

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }))
  }

  const toggleAll = () => {
    if (isAllExpanded) {
      // Condense all
      setExpandedCategories({})
    } else {
      // Expand all
      const nextState: Record<string, boolean> = {}
      allCategories.forEach((cat) => {
        nextState[cat] = true
      })
      setExpandedCategories(nextState)
    }
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
      setError('Please provide a link name.')
      return
    }

    if (!rawUrl) {
      setError('Please provide a URL.')
      return
    }

    const formattedUrl = formatUrl(rawUrl)
    setSubmitting(true)

    try {
      const targetCategory = selectedCategory || 'Other'
      const payload: {
        name: string
        url: string
        user_id: string
        author_name: string
        category?: string
      } = {
        name: trimmedName,
        url: formattedUrl,
        user_id: currentUserId,
        author_name: currentAuthorName || 'Brother',
        category: targetCategory,
      }

      const insertRes = await supabase
        .from('community_links')
        .insert(payload)
        .select()
        .single()

      let insertedData = insertRes.data

      // Fallback if the category column hasn't been added to Supabase table yet
      if (insertRes.error && (insertRes.error.code === '42703' || insertRes.error.message?.includes('category'))) {
        const fallbackPayload = {
          name: trimmedName,
          url: formattedUrl,
          user_id: currentUserId,
          author_name: currentAuthorName || 'Brother',
        }
        const fallbackRes = await supabase
          .from('community_links')
          .insert(fallbackPayload)
          .select()
          .single()

        if (fallbackRes.error) {
          setError(fallbackRes.error.message || 'Failed to add link.')
          return
        }
        insertedData = { ...(fallbackRes.data as CommunityLink), category: targetCategory }
      } else if (insertRes.error) {
        setError(insertRes.error.message || 'Failed to add link.')
        return
      }

      if (insertedData) {
        setLinks((prev) => [insertedData as CommunityLink, ...prev])
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
    <section className="space-y-6">
      {/* Top Header: Title & Expand / Condense All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-red-700 dark:text-red-500" />
            Community Links
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Important links and resources organized by category.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all shadow-xs self-start sm:self-auto"
        >
          <ChevronsUpDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>{isAllExpanded ? 'Condense All' : 'Expand All'}</span>
        </button>
      </div>

      {/* Category Blocks: 3 in a row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {allCategories.map((category) => {
          const categoryLinks = groupedLinks[category] || []
          const isExpanded = !!expandedCategories[category]

          return (
            <div
              key={category}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 flex flex-col"
            >
              {/* Category Header (Clickable for collapse/expand) */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors focus:outline-none select-none"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CategoryIcon
                    category={category}
                    className="h-4 w-4 text-red-700 dark:text-red-500 shrink-0"
                  />
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {category}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 shrink-0">
                    {categoryLinks.length}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-0' : '-rotate-90'
                    }`}
                />
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 flex-1 flex flex-col border-t border-gray-100 dark:border-zinc-800/60">
                  {categoryLinks.length > 0 ? (
                    <ul className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                      {categoryLinks.map((link) => (
                        <li
                          key={link.id}
                          className="group flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors"
                        >
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-red-700 dark:hover:text-red-400 transition-colors truncate flex-1 min-w-0"
                            title={link.url}
                          >
                            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors" />
                            <span className="truncate">{link.name}</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setSelectedLink(link)}
                            className="p-1 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            aria-label={`Details for ${link.name}`}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                      No links in this category
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom One-Line Input Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAddLink()
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          {/* Name input */}
          <input
            type="text"
            placeholder="Name (e.g. Google Drive)"
            value={urlName}
            onChange={(e) => setUrlName(e.target.value)}
            disabled={submitting}
            className="flex-1 min-w-0 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
          />

          {/* URL input */}
          <input
            type="text"
            placeholder="URL (e.g. drive.google.com/...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={submitting}
            className="flex-1 min-w-0 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
          />

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={submitting}
            className="w-full sm:w-44 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all cursor-pointer"
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !urlName.trim() || !urlInput.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 stroke-[2.5]" />
            )}
            <span>Submit</span>
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2.5">{error}</p>
        )}
      </div>

      {/* 3-Dots Details Modal */}
      {selectedLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 relative">
            <button
              type="button"
              onClick={() => setSelectedLink(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pr-6 flex items-center gap-2">
              <Globe className="h-5 w-5 text-red-700 dark:text-red-500 shrink-0" />
              Link Details
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Name
                </span>
                <p className="text-gray-900 dark:text-gray-100 font-medium bg-gray-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-700/50">
                  {selectedLink.name}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Category
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/40">
                  <CategoryIcon category={selectedLink.category || 'Other'} className="h-3.5 w-3.5" />
                  {selectedLink.category || 'Other'}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  URL
                </span>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-xs break-all bg-gray-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-700/50 select-all">
                  {selectedLink.url}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Added By
                </span>
                <p className="text-gray-900 dark:text-gray-100 flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-700/50">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{selectedLink.author_name || 'Member'}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <a
                href={selectedLink.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
              >
                <span>Open Link</span>
                <ExternalLink className="h-3.5 w-3.5" />
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
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 text-center">
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
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
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
    </section>
  )
}
