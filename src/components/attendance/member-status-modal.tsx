'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MemberProfile, MemberStatus } from './types';
import { AttendancePermissions } from './permissions';
import { updateMemberStatusAndExcusesAction } from '@/app/attendance/actions';
import { UserCheck, ShieldCheck, DollarSign, Award, Loader2 } from 'lucide-react';

interface MemberStatusModalProps {
  member: MemberProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedMember: MemberProfile) => void;
  permissions: AttendancePermissions;
}

export default function MemberStatusModal({
  member,
  isOpen,
  onClose,
  onUpdated,
  permissions,
}: MemberStatusModalProps) {
  const [status, setStatus] = useState<MemberStatus>('ACTIVE');
  const [duesExcused, setDuesExcused] = useState<boolean>(false);
  const [concessionsExcused, setConcessionsExcused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member && isOpen) {
      setStatus((member.status as MemberStatus) || 'ACTIVE');
      setDuesExcused(!!member.dues_excused);
      setConcessionsExcused(!!member.concessions_excused);
      setError(null);
    }
  }, [member, isOpen]);

  if (!member) return null;

  const displayName = member.first_name && member.first_name !== 'TEMP'
    ? `${member.first_name} ${member.last_name || ''}`.trim()
    : member.username;

  const canEditDuesExcuse = permissions.isFullOfficer || permissions.canEditDues;
  const canEditConcessionsExcuse = permissions.isFullOfficer || permissions.canEditConcessions;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await updateMemberStatusAndExcusesAction({
        userId: member.id,
        status,
        duesExcused,
        concessionsExcused,
      });

      if (!res.success) {
        setError(res.error || 'Failed to update member status.');
        return;
      }

      onUpdated({
        ...member,
        status,
        dues_excused: duesExcused,
        concessions_excused: concessionsExcused,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {displayName}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                @{member.username} • Role: {member.role || 'Member'} • {member.attendance_points || 0} pts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          {/* Member Status Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="member-status" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Member Status
            </Label>
            <select
              id="member-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MemberStatus)}
              className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="ACTIVE">ACTIVE (Active Member)</option>
              <option value="ACTIVE_COOP">ACTIVE_COOP (Active Co-op)</option>
              <option value="INACTIVE_COOP">INACTIVE_COOP (Inactive Co-op)</option>
              <option value="ABROAD">ABROAD (Study Abroad)</option>
              <option value="ALUMNI">ALUMNI (Alumni)</option>
              <option value="OTHER">OTHER (Other Standing)</option>
            </select>
            <p className="text-[11px] text-gray-400">
              Designates chapter standing and participation expectations for this member.
            </p>
          </div>

          {/* Dues & Concessions Exemptions */}
          <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              Requirement Exemptions
            </div>

            {/* Excuse Dues Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={duesExcused}
                onChange={(e) => setDuesExcused(e.target.checked)}
                disabled={!canEditDuesExcuse}
                className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <div className="flex-1 text-xs">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                  EXCUSE DUES
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Greys out the Dues box on the attendance sheet and marks dues as excused.
                </p>
              </div>
            </label>

            {/* Excuse Concessions Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-2 border-t border-amber-200/50 dark:border-amber-900/40">
              <input
                type="checkbox"
                checked={concessionsExcused}
                onChange={(e) => setConcessionsExcused(e.target.checked)}
                disabled={!canEditConcessionsExcuse}
                className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <div className="flex-1 text-xs">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-amber-600" />
                  EXCUSE CONSESSIONS
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Greys out the Consessions box on the attendance sheet and marks concessions as excused.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-200 dark:border-zinc-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-red-700 hover:bg-red-800 text-white flex items-center gap-1.5"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
