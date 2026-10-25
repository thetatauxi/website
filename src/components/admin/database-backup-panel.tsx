'use client'

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { downloadDatabaseSqlBackupAction, restoreDatabaseFromSqlAction } from '@/app/admin/backup-actions';
import { Download, Upload, Database, AlertTriangle, CheckCircle2, Loader2, FileCode } from 'lucide-react';

interface DatabaseBackupPanelProps {
  userRole?: string;
}

export default function DatabaseBackupPanel({ userRole }: DatabaseBackupPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Restore Modal State
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [sqlFile, setSqlFile] = useState<File | null>(null);
  const [sqlContent, setSqlContent] = useState<string>('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManageBackups = ['admin', 'regent', 'vice regent', 'scribe', 'treasurer', 'website chair', 'web chair', 'website']
    .includes((userRole || '').toLowerCase());

  if (!canManageBackups) {
    return null;
  }

  // Handle Download Backup (.sql)
  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    setDownloadSuccess(null);
    setDownloadError(null);

    try {
      const res = await downloadDatabaseSqlBackupAction();
      if (!res.success || !res.sqlContent) {
        setDownloadError(res.error || 'Failed to generate backup.');
        return;
      }

      // Trigger client-side file download
      const blob = new Blob([res.sqlContent], { type: 'application/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.fileName || 'theta_tau_database_backup.sql');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(`Backup generated! ${res.totalRows || 0} records exported.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed.';
      setDownloadError(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.sql')) {
      setRestoreResult({ success: false, error: 'Please select a valid .sql backup file.' });
      return;
    }

    setSqlFile(file);
    setRestoreResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSqlContent(content);
    };
    reader.readAsText(file);
  };

  // Handle Restore Execution
  const handleExecuteRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sqlContent) {
      setRestoreResult({ success: false, error: 'Please choose a .sql backup file first.' });
      return;
    }

    if (confirmPhrase.trim().toUpperCase() !== 'RESTORE DATABASE') {
      setRestoreResult({ success: false, error: 'You must type "RESTORE DATABASE" to confirm.' });
      return;
    }

    setIsRestoring(true);
    setRestoreResult(null);

    try {
      const res = await restoreDatabaseFromSqlAction({
        sqlContent,
        confirmationPhrase: confirmPhrase,
      });

      if (!res.success) {
        setRestoreResult({ success: false, error: res.error || 'Restoration failed.' });
      } else {
        setRestoreResult({ success: true, message: res.message || 'Database successfully restored.' });
        setConfirmPhrase('');
        setSqlFile(null);
        setSqlContent('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during restore.';
      setRestoreResult({ success: false, error: msg });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-red-700 dark:text-red-500" />
          Database Backup &amp; Disaster Recovery
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
          Admin Tools
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Export a complete SQL snapshot of chapter records (profiles, alumni, family tree, attendance), or restore tables from a previous backup file.
      </p>

      {downloadSuccess && (
        <div className="mb-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {downloadError && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {/* Download Backup Button */}
        <Button
          type="button"
          onClick={handleDownloadBackup}
          disabled={isDownloading}
          className="flex-1 sm:flex-initial h-9 px-3.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Generating SQL...</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>Download backup</span>
            </>
          )}
        </Button>

        {/* Restore from Backup SQL Button */}
        <Button
          type="button"
          onClick={() => {
            setIsRestoreOpen(true);
            setRestoreResult(null);
          }}
          variant="outline"
          className="flex-1 sm:flex-initial h-9 px-3.5 border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Upload className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
          <span>Restore from backup SQL</span>
        </Button>
      </div>

      {/* Safety Confirmation Modal for Restore */}
      <Dialog open={isRestoreOpen} onOpenChange={(open) => !isRestoring && setIsRestoreOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Restore Database from SQL
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                  Execute statements from a Supabase SQL dump file.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* High Warning Alert */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Large Database Operation
            </div>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
              This process executes raw statements that will overwrite and update table records in Supabase. Only restore files downloaded from this chapter portal.
            </p>
          </div>

          {restoreResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                restoreResult.success
                  ? 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400'
              }`}
            >
              {restoreResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{restoreResult.message || restoreResult.error}</span>
            </div>
          )}

          <form onSubmit={handleExecuteRestore} className="space-y-4 mt-2">
            {/* File Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Select .SQL Backup File
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql"
                  onChange={handleFileChange}
                  disabled={isRestoring}
                  className="text-xs bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                />
              </div>
              {sqlFile && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FileCode className="h-3.5 w-3.5 text-red-600" />
                  {sqlFile.name} ({(sqlFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Confirmation Input */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm-phrase" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Type <span className="font-mono text-red-600 dark:text-red-400 font-bold select-all">RESTORE DATABASE</span> to confirm:
              </Label>
              <Input
                id="confirm-phrase"
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="RESTORE DATABASE"
                disabled={isRestoring || !sqlContent}
                className="text-xs font-mono uppercase bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:ring-red-600"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRestoreOpen(false)}
                disabled={isRestoring}
                className="text-xs h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isRestoring || !sqlContent || confirmPhrase.trim().toUpperCase() !== 'RESTORE DATABASE'}
                className="text-xs h-8 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Executing Restore...
                  </>
                ) : (
                  'Confirm & Restore'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
