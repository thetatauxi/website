'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AttendanceEvent } from './types';
import { createAttendanceEventAction } from '@/app/attendance/actions';
import { Calendar, Plus, Loader2 } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: AttendanceEvent) => void;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onEventCreated,
}: CreateEventModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [points, setPoints] = useState<number>(1);
  const [type, setType] = useState<string>('general');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Event name is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await createAttendanceEventAction({
        name: name.trim(),
        date,
        points: Number(points) || 0,
        type,
        is_active: isActive,
      });

      if (!res.success || !res.event) {
        setError(res.error || 'Failed to create event.');
        setIsLoading(false);
        return;
      }

      onEventCreated(res.event);
      // Reset form
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      setPoints(1);
      setType('general');
      setIsActive(true);
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Calendar className="h-5 w-5 text-red-600 dark:text-red-500" />
            Make an Event
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 text-xs">
            Create an event to generate a live QR code and add a new column to the attendance grid.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Event Name */}
          <div className="space-y-1.5">
            <Label htmlFor="event-name" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Event Name *
            </Label>
            <Input
              id="event-name"
              placeholder="e.g. Chapter Meeting #1, Rush Night 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
              required
            />
          </div>

          {/* Date and Points Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Date
              </Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-points" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Points Value
              </Label>
              <Input
                id="event-points"
                type="number"
                min="0"
                step="1"
                value={points}
                onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
              />
              <p className="text-[11px] text-gray-400">Set to 0 for Rush or optional events</p>
            </div>
          </div>

          {/* Type / Category */}
          <div className="space-y-1.5">
            <Label htmlFor="event-type" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Event Type
            </Label>
            <select
              id="event-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="general">General / Chapter</option>
              <option value="rush">Rush (0 pts)</option>
              <option value="brotherhood">Brotherhood Pillar</option>
              <option value="professional">Professional Development</option>
              <option value="service">Community Service</option>
              <option value="concessions">Concessions</option>
            </select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Active for QR Scanning</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">When active, member QR code scans are valid.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-red-700 hover:bg-red-800 text-white flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
