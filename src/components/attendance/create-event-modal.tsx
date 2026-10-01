'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AttendanceEvent, MemberProfile } from './types';
import { parseAttendancePermissions } from './permissions';
import { createAttendanceEventAction } from '@/app/attendance/actions';
import { Calendar, Plus, Loader2 } from 'lucide-react';

import { STANDARD_EVENT_TYPES, getDefaultPointsForEventType } from './event-types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: AttendanceEvent) => void;
  currentUserProfile?: MemberProfile | null;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onEventCreated,
  currentUserProfile,
}: CreateEventModalProps) {
  const permissions = parseAttendancePermissions(currentUserProfile?.role);

  // Available event types based on chair role
  const availableEventTypes = permissions.isFullOfficer
    ? STANDARD_EVENT_TYPES
    : STANDARD_EVENT_TYPES.filter(
        (t) =>
          permissions.canManageCategory(t.name) ||
          permissions.canManageCategory(t.category) ||
          permissions.allowedCategories.some((c) =>
            t.name.toLowerCase().includes(c.toLowerCase()) ||
            c.toLowerCase().includes(t.name.toLowerCase())
          )
      );

  const defaultCategory = availableEventTypes[0]?.name || 'Meetings';

  const [name, setName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<string>(defaultCategory);
  const [isSpecialValue, setIsSpecialValue] = useState<boolean>(false);
  const [points, setPoints] = useState<number>(() => getDefaultPointsForEventType(defaultCategory));
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialType = availableEventTypes[0]?.name || 'Meetings';
      setType(initialType);
      setIsSpecialValue(false);
      setPoints(getDefaultPointsForEventType(initialType));
      setError(null);
    }
  }, [isOpen, availableEventTypes]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (!isSpecialValue) {
      setPoints(getDefaultPointsForEventType(newType));
    }
  };

  const handleSpecialValueToggle = (checked: boolean) => {
    setIsSpecialValue(checked);
    if (!checked) {
      setPoints(getDefaultPointsForEventType(type));
    }
  };

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
      setType(defaultCategory);
      setIsSpecialValue(false);
      setPoints(getDefaultPointsForEventType(defaultCategory));
      setIsActive(true);
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const isRestrictedChair = !permissions.isFullOfficer && availableEventTypes.length <= 1;

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
              placeholder="e.g. Chapter Meeting #1, Brotherhood Night"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
              required
            />
          </div>

          {/* Type / Category */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="event-type" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Event Type
              </Label>
              {isRestrictedChair && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">
                  Locked to your chair position
                </span>
              )}
            </div>

            {isRestrictedChair ? (
              <div className="w-full h-10 px-3 py-2 text-sm rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold flex items-center justify-between">
                <span>{type}</span>
                <span className="text-xs font-semibold opacity-75">{getDefaultPointsForEventType(type)} pts default</span>
              </div>
            ) : (
              <select
                id="event-type"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                {availableEventTypes.map((et) => (
                  <option key={et.name} value={et.name}>
                    {et.name} ({et.defaultPoints} pts)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date and Points Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="h-5 flex items-center">
                <Label htmlFor="event-date" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Date
                </Label>
              </div>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
              />
            </div>

            <div className="space-y-1.5">
              <div className="h-5 flex items-center justify-between">
                <Label htmlFor="event-points" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Points
                </Label>
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSpecialValue}
                    onChange={(e) => handleSpecialValueToggle(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span className="font-semibold text-[10px] uppercase text-red-700 dark:text-red-400">Special Value</span>
                </label>
              </div>
              <Input
                id="event-points"
                type="number"
                min="0"
                step="1"
                value={points}
                disabled={!isSpecialValue}
                onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                title={!isSpecialValue ? "Automatically set by Event Type. Check 'Special Value' to edit." : "Custom points value"}
                className={`border-gray-200 dark:border-zinc-700 font-mono font-bold ${
                  !isSpecialValue
                    ? 'bg-gray-100 dark:bg-zinc-800/60 opacity-80 cursor-not-allowed text-gray-500 dark:text-gray-400'
                    : 'bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white'
                }`}
              />
            </div>
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
