'use client'

import React, { useState, useMemo } from 'react';
import { AttendanceEvent, AttendanceRecord, MemberProfile, EventCategory } from './types';
import CreateEventModal from './create-event-modal';
import EventModal from './event-modal';
import FullScreenQrView from './fullscreen-qr-view';
import { toggleAttendanceRecordAction } from '@/app/attendance/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Users,
  Loader2,
  ShieldAlert
} from 'lucide-react';

interface ScribeAttendanceGridProps {
  initialMembers: MemberProfile[];
  initialEvents: AttendanceEvent[];
  initialRecords: AttendanceRecord[];
  currentUserProfile?: MemberProfile | null;
  tablesMissing?: boolean;
}

export default function ScribeAttendanceGrid({
  initialMembers,
  initialEvents,
  initialRecords,
  tablesMissing = false,
}: ScribeAttendanceGridProps) {
  // Data State
  const [members, setMembers] = useState<MemberProfile[]>(initialMembers);
  const [events, setEvents] = useState<AttendanceEvent[]>(initialEvents);
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);

  // Filter State
  const [memberSearch, setMemberSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventCategory>('all');
  const [minPoints, setMinPoints] = useState<string>('');
  const [maxPoints, setMaxPoints] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest'); // 'oldest' appends new events to the right

  // UI Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<AttendanceEvent | null>(null);
  const [fullScreenEvent, setFullScreenEvent] = useState<AttendanceEvent | null>(null);

  // Cell Loading Tracker
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  // Build fast O(1) attendance lookup set: `${eventId}:${userId}`
  const attendanceLookup = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      if (r.status === 'present') {
        map.set(`${r.event_id}:${r.user_id}`, r);
      }
    }
    return map;
  }, [records]);

  // Filtered and sorted events (columns)
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        // Event search
        if (eventSearch.trim() && !ev.name.toLowerCase().includes(eventSearch.toLowerCase().trim())) {
          return false;
        }
        // Type filter
        if (typeFilter !== 'all' && ev.type.toLowerCase() !== typeFilter.toLowerCase()) {
          return false;
        }
        // Points filter: Min and Max range
        if (minPoints.trim() !== '' && !isNaN(Number(minPoints))) {
          if (ev.points < Number(minPoints)) return false;
        }
        if (maxPoints.trim() !== '' && !isNaN(Number(maxPoints))) {
          if (ev.points > Number(maxPoints)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at || a.date).getTime();
        const timeB = new Date(b.created_at || b.date).getTime();
        return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
      });
  }, [events, eventSearch, typeFilter, minPoints, maxPoints, sortOrder]);

  // Filtered members (rows)
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (!memberSearch.trim()) return true;
      const q = memberSearch.toLowerCase().trim();
      const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
      const username = (m.username || '').toLowerCase();
      return fullName.includes(q) || username.includes(q);
    });
  }, [members, memberSearch]);

  // Checkbox Toggle Handler
  const handleToggle = async (eventId: string, userId: string) => {
    const key = `${eventId}:${userId}`;
    const isCurrentlyChecked = attendanceLookup.has(key);
    const newCheckedState = !isCurrentlyChecked;

    // Track loading
    setPendingToggles((prev) => new Set(prev).add(key));

    // Optimistic update of local records
    if (newCheckedState) {
      const tempRecord: AttendanceRecord = {
        id: `temp-${Date.now()}`,
        event_id: eventId,
        user_id: userId,
        status: 'present',
        points_awarded: events.find((e) => e.id === eventId)?.points || 0,
        scanned_at: new Date().toISOString(),
      };
      setRecords((prev) => [...prev, tempRecord]);
    } else {
      setRecords((prev) => prev.filter((r) => !(r.event_id === eventId && r.user_id === userId)));
    }

    try {
      const res = await toggleAttendanceRecordAction(eventId, userId, newCheckedState);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update attendance');
      }

      // Update local member points if returned
      if (typeof res.newPoints === 'number') {
        setMembers((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, attendance_points: res.newPoints! } : m))
        );
      }
    } catch (err) {
      console.error('Attendance toggle failed:', err);
      // Revert optimistic update
      if (newCheckedState) {
        setRecords((prev) => prev.filter((r) => !(r.event_id === eventId && r.user_id === userId)));
      } else {
        const revertRecord: AttendanceRecord = {
          id: `revert-${Date.now()}`,
          event_id: eventId,
          user_id: userId,
          status: 'present',
          points_awarded: events.find((e) => e.id === eventId)?.points || 0,
          scanned_at: new Date().toISOString(),
        };
        setRecords((prev) => [...prev, revertRecord]);
      }
      alert('Could not update attendance. Please try again.');
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Event Created
  const handleEventCreated = (newEvent: AttendanceEvent) => {
    setEvents((prev) => [...prev, newEvent]);
  };

  // Event Updated
  const handleEventUpdated = (updatedEvent: AttendanceEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    if (fullScreenEvent?.id === updatedEvent.id) {
      setFullScreenEvent(updatedEvent);
    }
  };

  // Event Deleted
  const handleEventDeleted = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setRecords((prev) => prev.filter((r) => r.event_id !== eventId));
    if (fullScreenEvent?.id === eventId) {
      setFullScreenEvent(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice if Tables Need Migration */}
      {tablesMissing && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-bold">Database Setup Notice</div>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
              The attendance tables haven&apos;t been detected in Supabase yet. Please execute the migration in{' '}
              <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">
                supabase/migrations/add_attendance_system.sql
              </code>{' '}
              in your Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-zinc-800 space-y-4">
        {/* Title and Top Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Chapter Attendance Grid</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 uppercase tracking-wider">
                Scribe & Officer Portal
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Real-time attendance matrix. Check boxes to award points, click column headers to view/edit events, or launch full-screen QR codes.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-red-700 hover:bg-red-800 text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Make an Event
          </Button>
        </div>

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
          {/* Member Search */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search member by name or username..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="pl-9 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-xs sm:text-sm h-10"
            />
          </div>

          {/* Event Search */}
          <div className="md:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search event title..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="pl-9 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-xs sm:text-sm h-10"
            />
          </div>

          {/* Type Filter */}
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EventCategory)}
              className="w-full h-10 px-3 py-2 text-xs sm:text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="all">All Types</option>
              <option value="rush">Rush</option>
              <option value="general">General Chapter</option>
              <option value="brotherhood">Brotherhood</option>
              <option value="professional">Professional Dev</option>
              <option value="service">Community Service</option>
              <option value="concessions">Concessions</option>
            </select>
          </div>

          {/* Points Filter: Centered 'Points' label with side-by-side Min - Max inputs */}
          <div className="md:col-span-2 flex flex-col justify-center items-center h-10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 select-none leading-none mb-1">
              Points
            </span>
            <div className="flex items-center gap-1.5 w-full">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
                className="w-full h-6 px-1.5 text-[11px] text-center rounded border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 font-mono"
              />
              <span className="text-gray-400 text-xs font-semibold select-none">-</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                className="w-full h-6 px-1.5 text-[11px] text-center rounded border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 font-mono"
              />
            </div>
          </div>

          {/* Sort Order */}
          <div className="md:col-span-1">
            <button
              onClick={() => setSortOrder(sortOrder === 'oldest' ? 'newest' : 'oldest')}
              className="w-full h-10 px-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              title="Toggle date order"
            >
              {sortOrder === 'oldest' ? 'Newest →' : '← Oldest'}
            </button>
          </div>
        </div>

        {/* Quick Stats Pill Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span>{filteredMembers.length} Members listed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>{filteredEvents.length} Events shown</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>{records.filter(r => r.status === 'present').length} Total check-ins recorded</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Checkbox Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto relative">
          <table className="w-full border-collapse text-left">
            {/* Table Header */}
            <thead>
              <tr className="bg-gray-100/90 dark:bg-zinc-800/90 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-zinc-700 text-xs">
                {/* Fixed Sticky Column: Member Name */}
                <th className="sticky left-0 z-20 bg-gray-100 dark:bg-zinc-800 p-3.5 min-w-[220px] max-w-[260px] font-bold uppercase tracking-wider shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between">
                    <span>Member Name</span>
                    <span className="text-[10px] text-gray-400 font-normal">Score</span>
                  </div>
                </th>

                {/* Event Columns */}
                {filteredEvents.map((ev) => (
                  <th
                    key={ev.id}
                    className="p-2.5 min-w-[130px] max-w-[170px] border-l border-gray-200 dark:border-zinc-700 font-semibold text-center select-none group hover:bg-gray-200/60 dark:hover:bg-zinc-750 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedEventForModal(ev)}
                      className="w-full text-center flex flex-col items-center gap-1 p-1 rounded hover:bg-white/50 dark:hover:bg-zinc-700/50 transition-all focus:outline-none"
                    >
                      {/* Name */}
                      <span className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-[150px] group-hover:text-red-700 dark:group-hover:text-red-400">
                        {ev.name}
                      </span>

                      {/* Badges: Points & Active indicator */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${ev.is_active ? 'bg-green-500 ring-2 ring-green-500/20' : 'bg-gray-400'}`} />
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          {ev.points === 0 ? '0 pts' : `${ev.points} pt${ev.points > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </button>
                  </th>
                ))}

                {/* Far Right "Add Event" Column Header */}
                <th className="p-3 border-l border-gray-200 dark:border-zinc-700 text-center min-w-[90px]">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition-colors mx-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs sm:text-sm">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={filteredEvents.length + 2} className="p-8 text-center text-gray-400 text-xs italic">
                    No members found matching &quot;{memberSearch}&quot;.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const displayName = member.first_name && member.first_name !== 'TEMP'
                    ? `${member.first_name} ${member.last_name || ''}`
                    : member.username;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-colors group"
                    >
                      {/* Sticky Member Row Column */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 group-hover:bg-red-50/60 dark:group-hover:bg-zinc-850 p-3 min-w-[220px] max-w-[260px] border-r border-gray-200 dark:border-zinc-800 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate">
                            <div className="font-bold text-gray-900 dark:text-white truncate">
                              {displayName}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono truncate">
                              @{member.username}
                            </div>
                          </div>

                          {/* Points Score Badge */}
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400 font-extrabold text-xs flex-shrink-0">
                            <span>{member.attendance_points || 0}</span>
                            <span className="text-[9px] uppercase font-semibold">pts</span>
                          </div>
                        </div>
                      </td>

                      {/* Event Checkbox Cells */}
                      {filteredEvents.map((ev) => {
                        const cellKey = `${ev.id}:${member.id}`;
                        const isChecked = attendanceLookup.has(cellKey);
                        const isPending = pendingToggles.has(cellKey);

                        return (
                          <td
                            key={ev.id}
                            className="p-2.5 text-center border-l border-gray-100 dark:border-zinc-800"
                          >
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleToggle(ev.id, member.id)}
                                disabled={isPending}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isChecked
                                  ? 'bg-red-700 hover:bg-red-800 text-white shadow-sm ring-2 ring-red-700/20'
                                  : 'bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:border-red-400 dark:hover:border-red-500'
                                  } active:scale-90`}
                              >
                                {isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                                ) : isChecked ? (
                                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                                ) : null}
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {/* Empty Placeholder for right Add Column */}
                      <td className="p-2.5 border-l border-gray-100 dark:border-zinc-800" />
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      {/* Event Details & Edit Modal */}
      <EventModal
        event={selectedEventForModal}
        isOpen={!!selectedEventForModal}
        totalMembersCount={members.length}
        totalCheckedInCount={
          selectedEventForModal
            ? records.filter((r) => r.event_id === selectedEventForModal.id && r.status === 'present').length
            : 0
        }
        onClose={() => setSelectedEventForModal(null)}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
        onOpenFullScreenCode={(ev) => {
          setSelectedEventForModal(null);
          setFullScreenEvent(ev);
        }}
      />

      {/* Kiosk Mode Full Screen QR View */}
      {fullScreenEvent && (
        <FullScreenQrView
          event={fullScreenEvent}
          attendanceRecords={records}
          members={members}
          onClose={() => setFullScreenEvent(null)}
          onEventStatusChange={handleEventUpdated}
        />
      )}
    </div>
  );
}
