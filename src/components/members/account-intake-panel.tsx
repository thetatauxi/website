'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  UserPlus,
  Send,
  ShieldCheck,
  Trash2,
  Mail,
  MailCheck,
  KeyRound,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import {
  processNewAccountIntakeAction,
  sendPasswordResetEmailAction,
  generateMemberDirectLinkAction,
  resendUnclaimedSetupEmailsAction,
  type ResendUnclaimedResult
} from '@/app/actions';
import { type AccountIntakeResult } from '@/lib/sheets/sync-engine';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AccountIntakePanelProps {
  userRole?: string;
}

export default function AccountIntakePanel({ userRole }: AccountIntakePanelProps) {
  void userRole;
  const router = useRouter();

  // Intake processing state
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [intakeResult, setIntakeResult] = useState<AccountIntakeResult | null>(null);
  const [intakeInlineStatus, setIntakeInlineStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Manual Reset / Direct Link state
  const [resetInput, setResetInput] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [directLink, setDirectLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Resend Unclaimed Setup Emails state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendResult, setResendResult] = useState<ResendUnclaimedResult | null>(null);
  const [copiedDetailIdx, setCopiedDetailIdx] = useState<number | null>(null);

  const handleSyncIntake = async () => {
    setIntakeLoading(true);
    setIntakeInlineStatus(null);
    try {
      const result = await processNewAccountIntakeAction();
      setIntakeResult(result);
      setIntakeModalOpen(true);

      if (result.success) {
        setIntakeInlineStatus({
          type: 'success',
          message: result.message,
        });
        router.refresh();
      } else {
        setIntakeInlineStatus({
          type: 'error',
          message: result.errors?.join('; ') || result.message,
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process intake';
      setIntakeInlineStatus({ type: 'error', message: errorMsg });
    } finally {
      setIntakeLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!resetInput.trim()) return;
    setResetLoading(true);
    setResetMessage(null);
    setDirectLink(null);
    try {
      const res = await sendPasswordResetEmailAction(resetInput);
      setResetMessage({ type: res.success ? 'success' : 'error', text: res.message });
    } catch (err: unknown) {
      setResetMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleGenerateDirectLink = async () => {
    if (!resetInput.trim()) return;
    setResetLoading(true);
    setResetMessage(null);
    setDirectLink(null);
    try {
      const res = await generateMemberDirectLinkAction(resetInput, 'recovery');
      if (res.success && res.link) {
        setDirectLink(res.link);
        setResetMessage({ type: 'success', text: res.message });
      } else {
        setResetMessage({ type: 'error', text: res.message });
      }
    } catch (err: unknown) {
      setResetMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to generate link' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendUnclaimedSetupEmails = async () => {
    setResendLoading(true);
    setResendResult(null);
    try {
      const res = await resendUnclaimedSetupEmailsAction();
      setResendResult(res);
      if (res.success && res.count > 0) {
        router.refresh();
      }
    } catch (err: unknown) {
      setResendResult({
        success: false,
        count: 0,
        message: err instanceof Error ? err.message : 'Failed to resend setup emails',
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Option 1: New Account Intake & Auto-Invite */}
      <div className="p-3.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
              New Account Intake & Auto-Invite
            </h4>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Tab: <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-red-100/60 dark:bg-red-900/40 text-red-800 dark:text-red-300 font-semibold">NewAccountIntake</code> &rarr; Column: <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-red-100/60 dark:bg-red-900/40 text-red-800 dark:text-red-300 font-semibold">wiscEmail</code>
          </p>
          {intakeInlineStatus && (
            <p className={`text-[11px] mt-1.5 font-medium ${intakeInlineStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {intakeInlineStatus.message}
            </p>
          )}
        </div>

        <button
          onClick={handleSyncIntake}
          disabled={intakeLoading}
          className="self-start sm:self-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-800 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${intakeLoading ? 'animate-spin' : ''}`} />
          {intakeLoading ? 'Processing...' : 'Run Intake'}
        </button>
      </div>

      {/* Option 2: Member Password Reset & Link Recovery */}
      <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 transition-colors">
        <div className="flex items-center gap-1.5 mb-1">
          <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
            Member Password Reset & Link Recovery
          </h4>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-2.5 leading-relaxed">
          Sends a link to reset password and update info on <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-amber-100/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">/setup-profile</code>. Use &ldquo;Generate Direct Link&rdquo; to copy and DM the link directly if campus email scanners expire their email link.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={resetInput}
            onChange={(e) => setResetInput(e.target.value)}
            placeholder="NetID or email (e.g. brbutler or brbutler@wisc.edu)"
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSendResetEmail}
              disabled={resetLoading || !resetInput.trim()}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
            >
              <Send className="h-3 w-3" />
              {resetLoading ? 'Sending...' : 'Send Reset Email'}
            </button>
            <button
              onClick={handleGenerateDirectLink}
              disabled={resetLoading || !resetInput.trim()}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-800 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
            >
              <ExternalLink className="h-3 w-3" />
              {resetLoading ? 'Generating...' : 'Generate Direct Link'}
            </button>
          </div>
        </div>

        {resetMessage && (
          <p className={`text-[11px] mt-2 font-medium ${resetMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {resetMessage.text}
          </p>
        )}

        {directLink && (
          <div className="mt-2.5 p-2 rounded-lg bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-700 flex items-center justify-between gap-2 shadow-sm">
            <span className="font-mono text-[10px] text-gray-800 dark:text-gray-200 truncate select-all flex-1">
              {directLink}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(directLink);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900 flex items-center gap-1 flex-shrink-0 transition-colors"
            >
              {copiedLink ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Option 3: Resend Pending Account Setup Emails */}
      <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 transition-colors">
        <div className="flex items-center gap-1.5 mb-1">
          <MailCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
            Pending Accounts Re-Invitation
          </h4>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-2.5 leading-relaxed">
          Re-dispatches setup emails with fresh 7-day links to anyone who has not completed profile setup (TEMP name) via Resend.
        </p>

        <button
          onClick={handleResendUnclaimedSetupEmails}
          disabled={resendLoading}
          className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-800 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
          {resendLoading ? 'Resending...' : 'Resend Account Setup Email'}
        </button>

        {resendResult && (
          <div className="mt-2.5 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 space-y-2">
            <p className={`text-[11px] font-medium ${resendResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {resendResult.message}
            </p>

            {resendResult.details && resendResult.details.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 mt-1 pr-1">
                {resendResult.details.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700/80 flex items-center justify-between gap-2 text-[11px]"
                  >
                    <div className="min-w-0 flex-1 truncate">
                      <span className="font-medium text-gray-900 dark:text-gray-200">{item.email}</span>
                      {item.username && <span className="text-gray-400 ml-1">({item.username})</span>}
                      {item.error && <span className="text-red-500 ml-1.5 text-[10px]">&bull; {item.error}</span>}
                    </div>
                    {item.setupUrl && (
                      <button
                        onClick={() => {
                          if (item.setupUrl) {
                            navigator.clipboard.writeText(item.setupUrl);
                            setCopiedDetailIdx(idx);
                            setTimeout(() => setCopiedDetailIdx(null), 2000);
                          }
                        }}
                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center gap-1 flex-shrink-0"
                      >
                        {copiedDetailIdx === idx ? <Check className="h-2.5 w-2.5 text-green-600" /> : <Copy className="h-2.5 w-2.5" />}
                        {copiedDetailIdx === idx ? 'Copied Link' : 'Copy Link'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Horizontal Widescreen Intake Details Pop-up Modal */}
      <Dialog open={intakeModalOpen} onOpenChange={setIntakeModalOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Account Intake Summary
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                  Results from reading and processing the <span className="font-semibold text-gray-700 dark:text-gray-200">NewAccountIntake</span> Google Sheet tab.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Horizontal 2-Column Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-3 items-start">
            {/* Left Column: Outcome, Metrics, and Sheet Wipe Status */}
            <div className="md:col-span-5 space-y-3">
              {/* Headline Box */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/80 text-center">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-0.5">
                  Sync Outcome
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white leading-snug">
                  {intakeResult?.message || 'No intake run yet'}
                </h3>
              </div>

              {/* Side-by-Side Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40">
                  <div className="flex items-center justify-between text-green-700 dark:text-green-400 mb-0.5">
                    <span className="text-[11px] font-semibold">Invites Sent</span>
                    <Send className="h-3 w-3" />
                  </div>
                  <div className="text-2xl font-black text-green-900 dark:text-green-200">
                    {intakeResult?.invitesSent ?? 0}
                  </div>
                  <p className="text-[10px] text-green-700/80 dark:text-green-400/80">
                    Emails dispatched
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-0.5">
                    <span className="text-[11px] font-semibold">Already in Use</span>
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                  <div className="text-2xl font-black text-amber-900 dark:text-amber-200">
                    {intakeResult?.alreadyUsed ?? 0}
                  </div>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                    Accounts skipped
                  </p>
                </div>
              </div>

              {/* Sheet Wipe Status */}
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-[11px]">
                    Sheet Cleanup:
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-[11px] ${intakeResult?.wiped ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                    {intakeResult?.wiped
                      ? `Wiped ${intakeResult.wipedRowsCount ?? ''} row${(intakeResult.wipedRowsCount ?? 0) === 1 ? '' : 's'}`
                      : 'No rows wiped'}
                  </span>
                  {!!intakeResult?.unsentRowsCount && intakeResult.unsentRowsCount > 0 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                      ({intakeResult.unsentRowsCount} unsent row{intakeResult.unsentRowsCount === 1 ? '' : 's'} preserved)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Itemized Breakdown Lists & Errors */}
            <div className="md:col-span-7 bg-gray-50/70 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-gray-200/80 dark:border-zinc-700/60 space-y-3">
              {intakeResult && (intakeResult.invitedEmails.length > 0 || intakeResult.alreadyUsedEmails.length > 0) ? (
                <div className="space-y-2.5">
                  {intakeResult.invitedEmails.length > 0 && (
                    <div>
                      <span className="font-semibold text-green-700 dark:text-green-400 text-[11px] block mb-1">
                        Invited Members ({intakeResult.invitedEmails.length}):
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {intakeResult.invitedEmails.map(email => (
                          <span key={email} className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 dark:bg-green-950/80 dark:text-green-300 text-[10px] font-mono">
                            {email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {intakeResult.alreadyUsedEmails.length > 0 && (
                    <div className="pt-1 border-t border-gray-200 dark:border-zinc-700/60">
                      <span className="font-semibold text-amber-700 dark:text-amber-400 text-[11px] block mb-1">
                        Already Registered ({intakeResult.alreadyUsedEmails.length}):
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {intakeResult.alreadyUsedEmails.map(email => (
                          <span key={email} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-mono">
                            {email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                  No email entries were processed in this run.
                </div>
              )}

              {/* Warning / Errors if present */}
              {intakeResult?.errors && intakeResult.errors.length > 0 && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/40">
                  <span className="font-bold block mb-0.5 text-[11px]">Notice:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                    {intakeResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-zinc-800">
            <button
              onClick={() => setIntakeModalOpen(false)}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
