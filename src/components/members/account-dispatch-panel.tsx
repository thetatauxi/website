'use client'

import React, { useState } from 'react';
import {
  Send,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { dispatchAccountsAction, type DispatchAccountsResult } from '@/app/actions';

interface AccountDispatchPanelProps {
  userRole?: string;
}

type DispatchType = 'member' | 'reset' | 'pnm';

export default function AccountDispatchPanel({ userRole }: AccountDispatchPanelProps) {
  void userRole;

  const [dispatchType, setDispatchType] = useState<DispatchType>('member');
  const [targetInput, setTargetInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchAccountsResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic button label based on dropdown selection
  const getButtonLabel = () => {
    switch (dispatchType) {
      case 'member':
        return 'Send New Member email';
      case 'reset':
        return 'Send Recovery email';
      case 'pnm':
        return 'Send New PNM email';
    }
  };

  const handleDispatch = async () => {
    if (!targetInput.trim()) return;

    setLoading(true);
    setDispatchResult(null);
    setCopiedLink(false);

    try {
      const res = await dispatchAccountsAction({
        type: dispatchType,
        rawInput: targetInput.trim(),
      });

      setDispatchResult(res);
      if (res.success) {
        // Clear input on successful run
        setTargetInput('');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to dispatch accounts';
      setDispatchResult({
        success: false,
        message: errorMsg,
        count: 0,
        items: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Type Selector Dropdown */}
      <div>
        <label
          htmlFor="dispatch-type-select"
          className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1"
        >
          Dispatch Type
        </label>
        <div className="relative">
          <select
            id="dispatch-type-select"
            value={dispatchType}
            onChange={(e) => {
              setDispatchType(e.target.value as DispatchType);
              setDispatchResult(null);
            }}
            disabled={loading}
            className="w-full appearance-none px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600 transition-colors cursor-pointer pr-8"
          >
            <option value="member">New Member Account</option>
            <option value="reset">Password Reset</option>
            <option value="pnm">New PNM Account</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500 dark:text-gray-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
          {dispatchType === 'pnm' && 'Creates a restricted Pledging Member (PNM) account for attendance with concessions automatically excused.'}
          {dispatchType === 'member' && 'Creates a full member account and sends onboarding profile setup credentials.'}
          {dispatchType === 'reset' && 'Sends password recovery & account setup links directly to existing members.'}
        </p>
      </div>

      {/* NetID / Email Input (Comma-Separated) */}
      <div>
        <label
          htmlFor="dispatch-targets-input"
          className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1"
        >
          NetID or Email Address
        </label>
        <input
          id="dispatch-targets-input"
          type="text"
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleDispatch();
            }
          }}
          disabled={loading}
          placeholder="NetID or email (comma-separated for multiple, e.g. bbadger, brb@wisc.edu)"
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600 transition-colors"
        />
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 block">
          NetIDs automatically have <code className="font-mono text-gray-600 dark:text-gray-300">@wisc.edu</code> appended. Separate multiple accounts with commas.
        </span>
      </div>

      {/* Dynamic Dispatch Button */}
      <button
        type="button"
        onClick={handleDispatch}
        disabled={loading || !targetInput.trim()}
        className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg bg-red-800 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
      >
        <Send className={`h-3.5 w-3.5 ${loading ? 'animate-pulse' : ''}`} />
        <span>{loading ? 'Dispatching...' : getButtonLabel()}</span>
      </button>

      {/* Notification Below Button */}
      {dispatchResult && (
        <div
          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-colors ${dispatchResult.success
            ? dispatchResult.items.some(i => i.alreadyExisted)
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
              : 'bg-green-50/80 dark:bg-green-950/30 border-green-200 dark:border-green-900/40 text-green-900 dark:text-green-200'
            : 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200'
            }`}
        >
          {dispatchResult.success ? (
            dispatchResult.items.some(i => i.alreadyExisted) ? (
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            )
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-snug">{dispatchResult.message}</p>
            {dispatchResult.items.length > 1 && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                {dispatchResult.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/5 pt-1"
                  >
                    <span className="font-mono truncate">{item.email}</span>
                    <span className={`text-[10px] font-semibold ${item.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {item.success ? (item.alreadyExisted ? 'Sent Reset (Exists)' : 'Sent Invite') : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct Link Box (Only when exactly one account was processed) */}
      {dispatchResult?.directLink && (
        <div className="p-3 rounded-xl bg-gray-50/90 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 transition-colors shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <ExternalLink className="h-3 w-3 text-red-600 dark:text-red-400" />
              Direct Setup Link (Single Account)
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Active for 7 days
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-gray-800 dark:text-gray-200 truncate select-all flex-1">
              {dispatchResult.directLink}
            </span>
            <button
              type="button"
              onClick={() => {
                if (dispatchResult.directLink) {
                  navigator.clipboard.writeText(dispatchResult.directLink);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/80 flex items-center gap-1 flex-shrink-0 transition-colors border border-red-200/80 dark:border-red-900/60"
            >
              {copiedLink ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              {copiedLink ? 'Copied' : 'Copy Link'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Share this link directly via DM if the recipient cannot find their email or has university Safe Link filtering issues.
          </p>
        </div>
      )}
    </div>
  );
}
