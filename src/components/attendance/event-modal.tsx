'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AttendanceEvent } from './types';
import { updateAttendanceEventAction, deleteAttendanceEventAction } from '@/app/attendance/actions';
import { Maximize2, Trash2, Copy, Check, Loader2, Users, Save } from 'lucide-react';

interface EventModalProps {
  event: AttendanceEvent | null;
  isOpen: boolean;
  totalCheckedInCount: number;
  totalMembersCount: number;
  onClose: () => void;
  onEventUpdated: (updatedEvent: AttendanceEvent) => void;
  onEventDeleted: (eventId: string) => void;
  onOpenFullScreenCode: (event: AttendanceEvent) => void;
}

export default function EventModal({
  event,
  isOpen,
  totalCheckedInCount,
  totalMembersCount,
  onClose,
  onEventUpdated,
  onEventDeleted,
  onOpenFullScreenCode,
}: EventModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [points, setPoints] = useState<number>(0);
  const [type, setType] = useState('general');
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when event opens
  useEffect(() => {
    if (event) {
      setName(event.name || '');
      setDate(event.date || '');
      setPoints(typeof event.points === 'number' ? event.points : 0);
      setType(event.type || 'general');
      setIsActive(event.is_active ?? true);
      setError(null);
      setShowConfirmDelete(false);
    }
  }, [event]);

  if (!event) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Event name is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await updateAttendanceEventAction(event.id, {
        name: name.trim(),
        date: date.trim(),
        points: Number(points) || 0,
        type,
        is_active: isActive,
      });

      if (!res.success) {
        setError(res.error || 'Failed to update event.');
        setIsLoading(false);
        return;
      }

      onEventUpdated({
        ...event,
        name: name.trim(),
        date: date.trim(),
        points: Number(points) || 0,
        type,
        is_active: isActive,
      });
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while saving.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await deleteAttendanceEventAction(event.id);
      if (!res.success) {
        setError(res.error || 'Failed to delete event.');
        setIsDeleting(false);
        return;
      }

      onEventDeleted(event.id);
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while deleting.';
      setError(errorMsg);
      setIsDeleting(false);
    }
  };

  const checkInUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/attendance/scan/${event.code}`
    : `/attendance/scan/${event.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkInUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white p-6 sm:p-7 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span>Event Details &amp; Settings</span>
            </DialogTitle>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-400 border border-gray-200 dark:border-zinc-700'
            }`}>
              {isActive ? 'Active for Scans' : 'Inactive / Closed'}
            </span>
          </div>
          <DialogDescription className="text-gray-500 dark:text-gray-400 text-xs">
            Edit event parameters, view check-in metrics, or project the full-screen QR code for members.
          </DialogDescription>
        </DialogHeader>

        {/* Live Attendance Metric & Full Screen Launch Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 mt-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-700 dark:text-red-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-red-900 dark:text-red-400">
                Live Attendance Count
              </div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                {totalCheckedInCount} <span className="text-xs font-medium text-gray-500 dark:text-gray-400">/ {totalMembersCount} members checked in</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => onOpenFullScreenCode(event)}
            className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs h-9 px-4 rounded-lg flex items-center gap-2 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Full Screen Code</span>
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 mt-1">
          {/* Two Column Grid to Fit Comfortably Without Scrolling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Event Core Attributes */}
            <div className="space-y-3">
              {/* Event Name */}
              <div className="space-y-1">
                <Label htmlFor="edit-name" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Event Name *
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 font-medium h-9 text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Date & Points in 2 sub-columns */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="edit-date" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Date
                  </Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 h-9 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-points" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Points Value
                  </Label>
                  <Input
                    id="edit-points"
                    type="number"
                    min="0"
                    step="1"
                    value={points}
                    onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 font-bold h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Event Type / Category */}
              <div className="space-y-1">
                <Label htmlFor="edit-type" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Category / Pillar
                </Label>
                <select
                  id="edit-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-xs sm:text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="general">General / Chapter</option>
                  <option value="rush">Rush (0 pts)</option>
                  <option value="brotherhood">Brotherhood Pillar</option>
                  <option value="professional">Professional Development</option>
                  <option value="service">Community Service</option>
                  <option value="concessions">Concessions</option>
                </select>
              </div>
            </div>

            {/* Right Column: Gate Status & Direct Link */}
            <div className="space-y-3 flex flex-col justify-between">
              {/* Active Toggle Switch Card */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    Scan Gate Status
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {isActive ? 'Scans are currently accepted.' : 'Check-ins are closed.'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Direct Link Card */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Direct Check-In Link
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-7 px-2 text-[11px] flex items-center gap-1"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate bg-white dark:bg-zinc-900 p-1.5 rounded border border-gray-200 dark:border-zinc-700">
                  {checkInUrl}
                </div>
              </div>

              {/* Helpful Tip */}
              <div className="text-[11px] text-gray-400 italic">
                Tip: Changes to point values automatically update all members who have already checked in.
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            {showConfirmDelete ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-3"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm Delete'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmDelete(false)}
                  className="text-xs text-gray-500 h-9"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1.5 h-9"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Event</span>
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="border-gray-200 dark:border-zinc-700 text-xs h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center gap-1.5 h-9 px-5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
