'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { alumniLoginAction } from '@/app/family-tree/actions';
import { GraduationCap, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AlumniLoginCardProps {
  onSuccess?: () => void;
}

export default function AlumniLoginCard({ onSuccess }: AlumniLoginCardProps) {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your Alumni User ID, username, or email.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await alumniLoginAction(identifier.trim());
      if (!res.success) {
        setError(res.error || 'Alumni ID not recognized.');
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alumni Family Tree Access</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Theta Tau Xi Chapter Lineage Portal</p>
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
        Graduated brothers can access the chapter family tree by entering your <strong>Alumni User ID</strong> (e.g. <code>alum_...</code>), unique username, or registered email.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="alumni-id" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            Alumni User ID / Username / Email
          </Label>
          <Input
            id="alumni-id"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. alum_john_doe or jdoe@wisc.edu"
            disabled={isLoading}
            className="text-sm bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !identifier.trim()}
          className="w-full h-10 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying Alumni ID...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Enter Family Tree
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Active brother?</span>
        <Link href="/login" className="font-semibold text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
          Sign In with Active Account &rarr;
        </Link>
      </div>
    </div>
  );
}
