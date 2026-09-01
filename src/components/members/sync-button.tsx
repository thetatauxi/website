'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { syncSheetAction } from '@/app/actions'

interface SyncButtonProps {
  sheetId?: string;
  label?: string;
}

export default function SyncButton({ sheetId = 'roster_status', label = 'Sync Roster Data' }: SyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await syncSheetAction(sheetId)
      if (result.success) {
        const count = result.updatedCount + result.insertedCount
        setMessage({ type: 'success', text: `Successfully synced ${count} records!` })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.errors.join('; ') || 'Sync failed.' })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync. Please try again.'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Syncing...' : label}
      </button>
      {message && (
        <p className={`text-xs ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
