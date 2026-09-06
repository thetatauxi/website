'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Table,
  ChevronDown,
  UserPlus,
  Send,
  ShieldCheck,
  Trash2,
  Mail
} from 'lucide-react';
import { syncSheetAction, syncAllSheetsAction, processNewAccountIntakeAction } from '@/app/actions';
import { SHEET_CONFIGS } from '@/config/sheets';
import { type AccountIntakeResult } from '@/lib/sheets/sync-engine';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SyncPanelProps {
  userRole?: string;
}

export default function SyncPanel({ userRole }: SyncPanelProps) {
  const [loadingSheetId, setLoadingSheetId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, { type: 'success' | 'error'; message: string; timestamp?: string }>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Modal state for New Account Intake results pop-up
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [intakeResult, setIntakeResult] = useState<AccountIntakeResult | null>(null);

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
      if (result.success) {
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
      } else {
        setSyncStatus(prev => ({
          ...prev,
          [sheetId]: {
            type: 'error',
            message: result.errors.join('; ') || 'Sync failed. Please check sheet credentials and table schema.',
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
      }
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

  const handleSyncIntake = async () => {
    setLoadingSheetId('account_intake');
    try {
      const result = await processNewAccountIntakeAction();
      setIntakeResult(result);
      setIntakeModalOpen(true);

      if (result.success) {
        setSyncStatus(prev => ({
          ...prev,
          account_intake: {
            type: 'success',
            message: result.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
        router.refresh();
      } else {
        setSyncStatus(prev => ({
          ...prev,
          account_intake: {
            type: 'error',
            message: result.errors?.join('; ') || result.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process account intake.';
      setSyncStatus(prev => ({
        ...prev,
        account_intake: {
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
      const failures = results.filter(r => !r.success);
      const totalAffected = results.reduce((sum, r) => sum + r.updatedCount + r.insertedCount, 0);

      if (failures.length === 0) {
        setSyncStatus(prev => ({
          ...prev,
          all: {
            type: 'success',
            message: `Successfully synced ${results.length} sheets (${totalAffected} total records affected)!`,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
        router.refresh();
      } else {
        const errSummary = failures.map(f => `${f.sheetName}: ${f.errors.join(', ')}`).join(' | ');
        setSyncStatus(prev => ({
          ...prev,
          all: {
            type: 'error',
            message: `Sync partially failed: ${errSummary}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
      }
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
      {/* Action Buttons Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Sync Member Roster */}
          <button
            onClick={() => handleSyncSingle('roster_status')}
            disabled={loadingSheetId !== null}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingSheetId === 'roster_status' ? 'animate-spin' : ''}`} />
            {loadingSheetId === 'roster_status' ? 'Syncing Roster...' : 'Sync Member Roster'}
          </button>

          {/* 2. Sync New Account Intake */}
          <button
            onClick={handleSyncIntake}
            disabled={loadingSheetId !== null}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <UserPlus className={`h-4 w-4 text-red-400 ${loadingSheetId === 'account_intake' ? 'animate-pulse' : ''}`} />
            {loadingSheetId === 'account_intake' ? 'Processing Intake...' : 'Sync New Account Intake'}
          </button>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 py-1.5"
        >
          <span>More Sheets ({accessibleSheets.length + 1})</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Roster Sync Status Alert */}
      {syncStatus['roster_status'] && (
        <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${syncStatus['roster_status'].type === 'success'
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

      {/* Account Intake Quick Status Alert (if not opened in modal) */}
      {syncStatus['account_intake'] && !intakeModalOpen && (
        <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${syncStatus['account_intake'].type === 'success'
            ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300 border border-green-200 dark:border-green-800/40'
            : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-800/40'
          }`}>
          {syncStatus['account_intake'].type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold">{syncStatus['account_intake'].message}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">
                Last ran: {syncStatus['account_intake'].timestamp}
              </span>
            </div>
            <button
              onClick={() => setIntakeModalOpen(true)}
              className="text-[11px] underline font-medium text-red-700 dark:text-red-400 hover:text-red-900"
            >
              View Details
            </button>
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
            {/* New Account Intake Card inside Drawer */}
            <div className="p-2.5 rounded-lg bg-red-50/40 dark:bg-red-950/20 border border-red-200/70 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    New Account Intake & Auto-Invite
                  </h4>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  Tab: <code className="font-mono text-[10px]">NewAccountIntake</code> &rarr; Column: <code className="font-mono text-[10px]">wiscEmail</code>
                </p>
                {syncStatus['account_intake'] && (
                  <p className={`text-[10px] mt-1 ${syncStatus['account_intake'].type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                    {syncStatus['account_intake'].message}
                  </p>
                )}
              </div>

              <button
                onClick={handleSyncIntake}
                disabled={loadingSheetId !== null}
                className="self-start sm:self-center px-2.5 py-1 text-xs font-medium rounded bg-white dark:bg-gray-700 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 hover:bg-red-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
              >
                <RefreshCw className={`h-3 w-3 ${loadingSheetId === 'account_intake' ? 'animate-spin' : ''}`} />
                {loadingSheetId === 'account_intake' ? 'Processing...' : 'Run Intake'}
              </button>
            </div>

            {/* Other Configured Sheets */}
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
                      <p className={`text-[10px] mt-1 ${status.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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

      {/* Pop-up Results Modal for Account Intake */}
      <Dialog open={intakeModalOpen} onOpenChange={setIntakeModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Account Intake Summary
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              Results from reading and processing the <span className="font-semibold text-gray-700 dark:text-gray-200">NewAccountIntake</span> Google Sheet tab.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Main Result Headline Box */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 text-center">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Sync Outcome
              </p>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                {intakeResult?.message || 'No intake run yet'}
              </h3>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Invites Sent Card */}
              <div className="p-3 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40">
                <div className="flex items-center justify-between text-green-700 dark:text-green-400 mb-1">
                  <span className="text-xs font-semibold">Invites Sent</span>
                  <Send className="h-3.5 w-3.5" />
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                  {intakeResult?.invitesSent ?? 0}
                </div>
                <p className="text-[11px] text-green-700/80 dark:text-green-400/80 mt-0.5">
                  Auth emails sent
                </p>
              </div>

              {/* Already in Use Card */}
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
                  <span className="text-xs font-semibold">Already in Use</span>
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                  {intakeResult?.alreadyUsed ?? 0}
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  Existing accounts skipped
                </p>
              </div>
            </div>

            {/* Google Sheet Wipe Status */}
            <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-zinc-500" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Google Sheet Intake Rows:
                </span>
              </div>
              <div className="text-right">
                <span className={`font-semibold ${intakeResult?.wiped ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                  {intakeResult?.wiped
                    ? `Wiped ${intakeResult.wipedRowsCount ?? ''} sent/used row${(intakeResult.wipedRowsCount ?? 0) === 1 ? '' : 's'}`
                    : 'No rows wiped'}
                </span>
                {!!intakeResult?.unsentRowsCount && intakeResult.unsentRowsCount > 0 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                    ({intakeResult.unsentRowsCount} unsent row{intakeResult.unsentRowsCount === 1 ? '' : 's'} preserved)
                  </span>
                )}
              </div>
            </div>

            {/* Itemized Lists (if available) */}
            {intakeResult && (intakeResult.invitedEmails.length > 0 || intakeResult.alreadyUsedEmails.length > 0) && (
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs pr-1">
                {intakeResult.invitedEmails.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-semibold text-green-700 dark:text-green-400 text-[11px]">
                      Invited ({intakeResult.invitedEmails.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {intakeResult.invitedEmails.map(email => (
                        <span key={email} className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 text-[10px] font-mono">
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {intakeResult.alreadyUsedEmails.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="font-semibold text-amber-700 dark:text-amber-400 text-[11px]">
                      Already Registered ({intakeResult.alreadyUsedEmails.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {intakeResult.alreadyUsedEmails.map(email => (
                        <span key={email} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-mono">
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error notifications if any */}
            {intakeResult?.errors && intakeResult.errors.length > 0 && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/40">
                <span className="font-semibold block mb-1">Warnings / Errors:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {intakeResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIntakeModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
