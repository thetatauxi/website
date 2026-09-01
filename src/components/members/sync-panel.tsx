'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle2, AlertCircle, Table, ChevronDown } from 'lucide-react';
import { syncSheetAction, syncAllSheetsAction } from '@/app/actions';
import { SHEET_CONFIGS } from '@/config/sheets';

interface SyncPanelProps {
  userRole?: string;
}

export default function SyncPanel({ userRole }: SyncPanelProps) {
  const [loadingSheetId, setLoadingSheetId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, { type: 'success' | 'error'; message: string; timestamp?: string }>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  // Filter sheets based on allowed roles if specified
  const accessibleSheets = SHEET_CONFIGS.filter(sheet => {
    if (!sheet.allowedRoles || sheet.allowedRoles.length === 0) return true;
    if (!userRole) return true;
    return sheet.allowedRoles.map(r => r.toLowerCase()).includes(userRole.toLowerCase());
  });

  const handleSyncSingle = async (sheetId: string) => {
    setLoadingSheetId(sheetId);
    try {
      const result = await syncSheetAction(sheetId);
      const affected = result.updatedCount + result.insertedCount;
      const addedMsg = result.addedToSheetCount && result.addedToSheetCount > 0
        ? ` & added ${result.addedToSheetCount} new member${result.addedToSheetCount === 1 ? '' : 's'} to Sheet`
        : '';
      setSyncStatus(prev => ({
        ...prev,
        [sheetId]: {
          type: 'success',
          message: `Synced ${affected} row${affected === 1 ? '' : 's'}${addedMsg} (${result.durationMs}ms)`,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      router.refresh();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sync. Check sheet connection.';
      setSyncStatus(prev => ({
        ...prev,
        [sheetId]: {
          type: 'error',
          message: errorMsg,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setLoadingSheetId(null);
    }
  };

  const handleSyncAll = async () => {
    setLoadingSheetId('all');
    try {
      const results = await syncAllSheetsAction();
      const totalAffected = results.reduce((sum, r) => sum + r.updatedCount + r.insertedCount, 0);
      setSyncStatus(prev => ({
        ...prev,
        all: {
          type: 'success',
          message: `Successfully synced ${results.length} sheets (${totalAffected} total records affected)!`,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      router.refresh();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sync all sheets.';
      setSyncStatus(prev => ({
        ...prev,
        all: {
          type: 'error',
          message: errorMsg,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setLoadingSheetId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Sync Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => handleSyncSingle('roster_status')}
          disabled={loadingSheetId !== null}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loadingSheetId === 'roster_status' ? 'animate-spin' : ''}`} />
          {loadingSheetId === 'roster_status' ? 'Syncing Roster...' : 'Sync Member Roster'}
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 py-2"
        >
          <span>More Sheets ({accessibleSheets.length})</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Global Status Message */}
      {syncStatus['roster_status'] && (
        <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
          syncStatus['roster_status'].type === 'success'
            ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300 border border-green-200 dark:border-green-800/40'
            : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-800/40'
        }`}>
          {syncStatus['roster_status'].type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <span>{syncStatus['roster_status'].message}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">
              Last synced: {syncStatus['roster_status'].timestamp}
            </span>
          </div>
        </div>
      )}

      {/* Expanded Multi-Sheet Drawer */}
      {isExpanded && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Configured Integrations
            </span>
            <button
              onClick={handleSyncAll}
              disabled={loadingSheetId !== null}
              className="text-xs text-red-700 dark:text-red-400 hover:underline font-medium disabled:opacity-50"
            >
              {loadingSheetId === 'all' ? 'Syncing all...' : 'Sync All Integrations'}
            </button>
          </div>

          <div className="space-y-2">
            {accessibleSheets.map((sheet) => {
              const status = syncStatus[sheet.id];
              const isLoading = loadingSheetId === sheet.id;

              return (
                <div
                  key={sheet.id}
                  className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-750/50 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Table className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {sheet.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      Tab: <code className="font-mono text-[10px]">{sheet.sheetName}</code> &rarr; Table: <code className="font-mono text-[10px]">{sheet.supabaseTable}</code>
                    </p>
                    {status && (
                      <p className={`text-[10px] mt-1 ${
                        status.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {status.message}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleSyncSingle(sheet.id)}
                    disabled={loadingSheetId !== null}
                    className="self-start sm:self-center px-2.5 py-1 text-xs font-medium rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Syncing...' : 'Sync'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
