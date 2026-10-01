'use client'

import React, { useState, useMemo } from 'react';
import { AttendanceEvent, AttendanceRecord, MemberProfile, EventCategory, AttendanceStatus } from './types';
import { parseAttendancePermissions } from './permissions';
import CreateEventModal from './create-event-modal';
import EventModal from './event-modal';
import FullScreenQrView from './fullscreen-qr-view';
import AttendanceStatusCell from './attendance-status-cell';
import MemberStatusModal from './member-status-modal';
import ExportQueryModal from './export-query-modal';
import { STANDARD_EVENT_TYPES } from './event-types';
import {
  setAttendanceStatusAction,
  toggleDuesAction,
  toggleConcessionsAction,
} from '@/app/attendance/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Users,
  Loader2,
  ShieldAlert,
  Eye,
  EyeOff,
  DollarSign,
  Award,
  Download,
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
  currentUserProfile,
  tablesMissing = false,
}: ScribeAttendanceGridProps) {
  // Role & Permissions
  const permissions = useMemo(() => {
    return parseAttendancePermissions(currentUserProfile?.role);
  }, [currentUserProfile?.role]);

  // Data State
  const [members, setMembers] = useState<MemberProfile[]>(initialMembers);
  const [events, setEvents] = useState<AttendanceEvent[]>(initialEvents);
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);

  // Column Visibility: Dues and Consessions
  const [showRequirementsColumns, setShowRequirementsColumns] = useState<boolean>(true);

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
  const [selectedMemberForStatus, setSelectedMemberForStatus] = useState<MemberProfile | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Cell Loading Trackers
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [pendingDues, setPendingDues] = useState<Set<string>>(new Set());
  const [pendingConcessions, setPendingConcessions] = useState<Set<string>>(new Set());

  // Fast O(1) attendance status lookup: `${eventId}:${userId}` -> AttendanceStatus
  const attendanceStatusMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const r of records) {
      const s = (r.status || '').toLowerCase().trim();
      if (s === 'present' || s === 'excused' || s === 'unexcused') {
        map.set(`${r.event_id}:${r.user_id}`, s as AttendanceStatus);
      }
    }
    return map;
  }, [records]);

  // Filtered and sorted events (columns): Hides non-applicable events for chairs
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        // Chair Restriction: Hide non-applicable events for chairs
        if (!permissions.isFullOfficer) {
          if (permissions.allowedCategories.length > 0) {
            // Category chair: only show their specific category events
            if (!permissions.canManageCategory(ev.type)) {
              return false;
            }
          } else if (permissions.canEditDues || permissions.canEditConcessions) {
            // Dedicated financial chairs (Treasurer / Fundraising): hide regular events
            return false;
          }
        }

        // Event search
        if (eventSearch.trim() && !ev.name.toLowerCase().includes(eventSearch.toLowerCase().trim())) {
          return false;
        }
        // Type filter (only applicable if officer)
        if (permissions.isFullOfficer && typeFilter !== 'all') {
          const t = ev.type.toLowerCase();
          const f = typeFilter.toLowerCase();
          if (t !== f && !t.includes(f) && !f.includes(t)) {
            return false;
          }
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
  }, [events, eventSearch, typeFilter, minPoints, maxPoints, sortOrder, permissions]);

  // Filtered members (rows)
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (!memberSearch.trim()) return true;
      const q = memberSearch.toLowerCase().trim();
      const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
      const username = (m.username || '').toLowerCase();
      const status = (m.status || '').toLowerCase();
      return fullName.includes(q) || username.includes(q) || status.includes(q);
    });
  }, [members, memberSearch]);

  // Attendance Status Selection Handler
  const handleSetAttendanceStatus = async (
    eventId: string,
    userId: string,
    newStatus: AttendanceStatus,
    eventType?: string
  ) => {
    if (!permissions.isFullOfficer && eventType && !permissions.canManageCategory(eventType)) {
      alert(`You do not have permission to manage '${eventType}' events.`);
      return;
    }

    const key = `${eventId}:${userId}`;
    const prevStatus = attendanceStatusMap.get(key) || 'empty';
    if (prevStatus === newStatus) return;

    setPendingToggles((prev) => new Set(prev).add(key));

    // Optimistic update of local records
    if (newStatus === 'empty') {
      setRecords((prev) => prev.filter((r) => !(r.event_id === eventId && r.user_id === userId)));
    } else {
      const targetEvent = events.find((e) => e.id === eventId);
      const points = newStatus === 'present' ? (targetEvent?.points || 0) : 0;
      setRecords((prev) => {
        const remaining = prev.filter((r) => !(r.event_id === eventId && r.user_id === userId));
        return [
          ...remaining,
          {
            id: `temp-${Date.now()}`,
            event_id: eventId,
            user_id: userId,
            status: newStatus as AttendanceStatus,
            points_awarded: points,
            scanned_at: new Date().toISOString(),
          },
        ];
      });
    }

    try {
      const res = await setAttendanceStatusAction(eventId, userId, newStatus);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update attendance');
      }

      // Update local member points & medals if returned
      if (typeof res.newPoints === 'number') {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === userId
              ? {
                  ...m,
                  attendance_points: res.newPoints!,
                  brotherhood_met: res.brotherhoodMet ?? m.brotherhood_met,
                  prof_dev_met: res.profDevMet ?? m.prof_dev_met,
                  comm_service_met: res.commServiceMet ?? m.comm_service_met,
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Attendance status update failed:', err);
      // Revert optimistic update
      if (prevStatus === 'empty') {
        setRecords((prev) => prev.filter((r) => !(r.event_id === eventId && r.user_id === userId)));
      } else {
        const targetEvent = events.find((e) => e.id === eventId);
        const points = prevStatus === 'present' ? (targetEvent?.points || 0) : 0;
        setRecords((prev) => {
          const remaining = prev.filter((r) => !(r.event_id === eventId && r.user_id === userId));
          return [
            ...remaining,
            {
              id: `revert-${Date.now()}`,
              event_id: eventId,
              user_id: userId,
              status: prevStatus as AttendanceStatus,
              points_awarded: points,
              scanned_at: new Date().toISOString(),
            },
          ];
        });
      }
      alert('Could not update attendance status. Please try again.');
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Dues Toggle Handler
  const handleToggleDues = async (userId: string, currentDuesPaid?: boolean) => {
    if (!permissions.canEditDues) return;
    const newDuesState = !currentDuesPaid;

    setPendingDues((prev) => new Set(prev).add(userId));
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, dues_paid: newDuesState } : m))
    );

    try {
      const res = await toggleDuesAction(userId, newDuesState);
      if (!res.success) throw new Error(res.error || 'Failed to update dues');
    } catch (err) {
      console.error('Dues toggle failed:', err);
      // Revert
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, dues_paid: currentDuesPaid } : m))
      );
      alert('Could not update Dues. Please try again.');
    } finally {
      setPendingDues((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Concessions Toggle Handler
  const handleToggleConcessions = async (userId: string, currentConcessionsDone?: boolean) => {
    if (!permissions.canEditConcessions) return;
    const newConcessionsState = !currentConcessionsDone;

    setPendingConcessions((prev) => new Set(prev).add(userId));
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, concessions_done: newConcessionsState } : m))
    );

    try {
      const res = await toggleConcessionsAction(userId, newConcessionsState);
      if (!res.success) throw new Error(res.error || 'Failed to update concessions');
    } catch (err) {
      console.error('Concessions toggle failed:', err);
      // Revert
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, concessions_done: currentConcessionsDone } : m))
      );
      alert('Could not update Consessions. Please try again.');
    } finally {
      setPendingConcessions((prev) => {
        const next = new Set(prev);
        next.delete(userId);
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

  const totalDuesPaidCount = members.filter((m) => m.dues_paid).length;
  const totalConcessionsDoneCount = members.filter((m) => m.concessions_done).length;

  // Dues and Consessions visibility restricted to respective chairs and executive officers
  const canSeeDues = permissions.isFullOfficer || permissions.canEditDues;
  const canSeeConcessions = permissions.isFullOfficer || permissions.canEditConcessions;
  const canSeeAnyRequirements = canSeeDues || canSeeConcessions;

  const requirementsButtonLabel = useMemo(() => {
    if (canSeeDues && canSeeConcessions) {
      return showRequirementsColumns ? 'Hide Dues & Consessions' : 'Show Dues & Consessions';
    }
    if (canSeeDues) {
      return showRequirementsColumns ? 'Hide Dues' : 'Show Dues';
    }
    if (canSeeConcessions) {
      return showRequirementsColumns ? 'Hide Consessions' : 'Show Consessions';
    }
    return '';
  }, [canSeeDues, canSeeConcessions, showRequirementsColumns]);

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
        {/* Title and Top Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Chapter Attendance Grid</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 uppercase tracking-wider">
                {permissions.badgeLabel}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Real-time attendance matrix. Dues and Consessions are highlighted in light gold. Check boxes to award attendance or update dues standing.
            </p>
          </div>

          {/* Make an Event Button */}
          {permissions.canCreateEvents && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Make an Event</span>
            </Button>
          )}
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

          {/* Type Filter: Dropdown for officers, fixed indicator for category chairs */}
          <div className="md:col-span-2">
            {permissions.isFullOfficer ? (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as EventCategory)}
                className="w-full h-10 px-3 py-2 text-xs sm:text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Types</option>
                {STANDARD_EVENT_TYPES.map((et) => (
                  <option key={et.name} value={et.name}>
                    {et.name} ({et.defaultPoints} pts)
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full h-10 px-3 py-2 text-xs rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-bold capitalize flex items-center truncate">
                {permissions.allowedCategories.length > 0
                  ? permissions.allowedCategories.includes('study tables')
                    ? 'Study Tables Scope'
                    : permissions.allowedCategories.includes('rush')
                      ? 'Rush Scope'
                      : `${permissions.allowedCategories.join(', ')} Pillar`
                  : permissions.canEditDues
                    ? 'Dues Scope'
                    : 'Consessions Scope'}
              </div>
            )}
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

        {/* Quick Stats Pill Bar with Show/Hide Button on the Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-4">
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
              <span>{records.filter((r) => r.status === 'present').length} Total check-ins</span>
            </div>
            {showRequirementsColumns && (
              <>
                {canSeeDues && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>
                      {totalDuesPaidCount} / {members.length} Dues paid
                    </span>
                  </div>
                )}
                {canSeeConcessions && (
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>
                      {totalConcessionsDoneCount} / {members.length} Consessions attended
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons on the right side in line with stats */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Export Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              className="h-7 px-2.5 text-[11px] font-semibold rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-750 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span>Export</span>
            </Button>

            {/* Button on the right side in line with the stats, made a bit smaller */}
            {canSeeAnyRequirements && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRequirementsColumns((prev) => !prev)}
                className={`h-7 px-2.5 text-[11px] font-semibold rounded-lg border flex items-center gap-1.5 transition-all shadow-xs ${showRequirementsColumns
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                  : 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-750'
                  }`}
              >
                {showRequirementsColumns ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                    <span>{requirementsButtonLabel}</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                    <span>{requirementsButtonLabel}</span>
                  </>
                )}
              </Button>
            )}
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
                {/* 1. Fixed Sticky Column: Member Name */}
                <th className="sticky left-0 z-30 bg-gray-100 dark:bg-zinc-800 p-3.5 w-[220px] min-w-[220px] max-w-[220px] font-bold uppercase tracking-wider shadow-[2px_0_5px_rgba(0,0,0,0.06)] border-r border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span>Member Name</span>
                    <span className="text-[10px] text-gray-400 font-normal">Score</span>
                  </div>
                </th>

                {/* 2. Scrolling Light Gold Column: Dues (When visible and authorized) */}
                {canSeeDues && showRequirementsColumns && (
                  <th
                    className="p-2.5 w-[84px] min-w-[84px] max-w-[84px] bg-amber-100/90 dark:bg-amber-950/60 border-r border-amber-200/80 dark:border-amber-900/60 font-bold text-center select-none"
                    title={permissions.canEditDues ? 'Treasurer & Officers can edit Dues' : 'Managed by Treasurer'}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-bold text-amber-950 dark:text-amber-200 text-xs">Dues</span>
                      <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-semibold tracking-tight">Req</span>
                    </div>
                  </th>
                )}

                {/* 3. Scrolling Light Gold Column: Consessions (When visible and authorized) */}
                {canSeeConcessions && showRequirementsColumns && (
                  <th
                    className="p-2.5 w-[104px] min-w-[104px] max-w-[104px] bg-amber-100/90 dark:bg-amber-950/60 border-r border-amber-200/80 dark:border-amber-900/60 font-bold text-center select-none"
                    title={permissions.canEditConcessions ? 'Fundraising Chair & Officers can edit Consessions' : 'Managed by Fundraising Chair'}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-bold text-amber-950 dark:text-amber-200 text-xs">Consessions</span>
                      <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-semibold tracking-tight">Req</span>
                    </div>
                  </th>
                )}

                {/* Event Columns: Stacked Name, Active/Points, and Type */}
                {filteredEvents.map((ev) => (
                  <th
                    key={ev.id}
                    className="p-2.5 min-w-[130px] max-w-[170px] border-r border-gray-200 dark:border-zinc-700 font-semibold text-center select-none group hover:bg-gray-200/60 dark:hover:bg-zinc-750 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedEventForModal(ev)}
                      className="w-full text-center flex flex-col items-center gap-1.5 p-1 rounded hover:bg-white/50 dark:hover:bg-zinc-700/50 transition-all focus:outline-none"
                    >
                      {/* 1. Event Name */}
                      <span className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-[150px] group-hover:text-red-700 dark:group-hover:text-red-400">
                        {ev.name}
                      </span>

                      {/* 2. Active Indicator & Points */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ev.is_active ? 'bg-green-500 ring-2 ring-green-500/20' : 'bg-gray-400'
                          }`}
                        />
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          {ev.points === 0 ? '0 pts' : `${ev.points} pt${ev.points > 1 ? 's' : ''}`}
                        </span>
                      </div>

                      {/* 3. Type Category */}
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-gray-200/70 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 font-semibold tracking-wide">
                        {ev.type}
                      </span>
                    </button>
                  </th>
                ))}

                {/* Far Right "Add Event" Column Header */}
                {permissions.canCreateEvents && (
                  <th className="p-3 border-r border-gray-200 dark:border-zinc-700 text-center min-w-[90px]">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center justify-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition-colors mx-auto"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs sm:text-sm">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      filteredEvents.length +
                      1 +
                      (canSeeDues && showRequirementsColumns ? 1 : 0) +
                      (canSeeConcessions && showRequirementsColumns ? 1 : 0) +
                      (permissions.canCreateEvents ? 1 : 0)
                    }
                    className="p-8 text-center text-gray-400 text-xs italic"
                  >
                    No members found matching &quot;{memberSearch}&quot;.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const displayName =
                    member.first_name && member.first_name !== 'TEMP'
                      ? `${member.first_name} ${member.last_name || ''}`
                      : member.username;

                  const isPendingDues = pendingDues.has(member.id);
                  const isPendingConcessions = pendingConcessions.has(member.id);

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-colors group"
                    >
                      {/* 1. Sticky Member Row Column (100% Solid Opaque Background to Prevent See-Through) */}
                      <td className="sticky left-0 z-20 bg-white dark:bg-zinc-900 group-hover:bg-[#fef2f2] dark:group-hover:bg-[#201a1a] p-3 w-[220px] min-w-[220px] max-w-[220px] transition-colors border-r border-gray-200 dark:border-zinc-800 shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemberForStatus(member);
                              setIsStatusModalOpen(true);
                            }}
                            className="truncate text-left focus:outline-none group/name"
                            title="Click to view/edit member status or excuse dues/concessions"
                          >
                            <div className="font-bold text-gray-900 dark:text-white truncate group-hover/name:text-red-700 dark:group-hover/name:text-red-400 group-hover/name:underline transition-colors">
                              {displayName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-mono truncate">
                                @{member.username}
                              </span>
                              {member.status && member.status !== 'ACTIVE' && (
                                <span className={`px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-tight ${
                                  member.status === 'ACTIVE_COOP'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                    : member.status === 'INACTIVE_COOP'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : member.status === 'ABROAD'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                    : member.status === 'ALUMNI'
                                    ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300'
                                }`}>
                                  {member.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Points Score Badge */}
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400 font-extrabold text-xs flex-shrink-0">
                            <span>{member.attendance_points || 0}</span>
                            <span className="text-[9px] uppercase font-semibold">pts</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Scrolling Light Gold Column: Dues Checkbox (When visible and authorized) */}
                      {canSeeDues && showRequirementsColumns && (
                        <td className="p-2.5 w-[84px] min-w-[84px] max-w-[84px] text-center bg-amber-50/70 dark:bg-amber-950/30 group-hover:bg-amber-100/70 dark:group-hover:bg-amber-900/40 border-r border-amber-200/70 dark:border-amber-900/40 transition-colors">
                          <div className="flex items-center justify-center">
                            {member.dues_excused ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMemberForStatus(member);
                                  setIsStatusModalOpen(true);
                                }}
                                title="Dues Excused for this member (Click to edit in status modal)"
                                className="w-full py-1 rounded bg-gray-200/90 dark:bg-zinc-800/90 border border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-gray-400 text-[10px] font-extrabold uppercase tracking-tight shadow-2xs hover:border-gray-400 transition-colors"
                              >
                                Excused
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleDues(member.id, member.dues_paid)}
                                disabled={!permissions.canEditDues || isPendingDues}
                                title={
                                  !permissions.canEditDues
                                    ? 'Only the Treasurer or Executive Officers can edit Dues'
                                    : member.dues_paid
                                      ? 'Dues Paid (Click to uncheck)'
                                      : 'Mark Dues as Paid'
                                }
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${member.dues_paid
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs ring-2 ring-amber-500/20'
                                  : 'bg-white/80 dark:bg-zinc-800 border border-amber-300 dark:border-amber-800/80 hover:border-amber-500'
                                  } ${!permissions.canEditDues
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'active:scale-90 cursor-pointer'
                                  }`}
                              >
                                {isPendingDues ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                                ) : member.dues_paid ? (
                                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                                ) : null}
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      {/* 3. Scrolling Light Gold Column: Consessions Checkbox (When visible and authorized) */}
                      {canSeeConcessions && showRequirementsColumns && (
                        <td className="p-2.5 w-[104px] min-w-[104px] max-w-[104px] text-center bg-amber-50/70 dark:bg-amber-950/30 group-hover:bg-amber-100/70 dark:group-hover:bg-amber-900/40 border-r border-amber-200/70 dark:border-amber-900/40 transition-colors">
                          <div className="flex items-center justify-center">
                            {member.concessions_excused ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMemberForStatus(member);
                                  setIsStatusModalOpen(true);
                                }}
                                title="Consessions Excused for this member (Click to edit in status modal)"
                                className="w-full py-1 rounded bg-gray-200/90 dark:bg-zinc-800/90 border border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-gray-400 text-[10px] font-extrabold uppercase tracking-tight shadow-2xs hover:border-gray-400 transition-colors"
                              >
                                Excused
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleConcessions(member.id, member.concessions_done)}
                                disabled={!permissions.canEditConcessions || isPendingConcessions}
                                title={
                                  !permissions.canEditConcessions
                                    ? 'Only the Fundraising Chair or Executive Officers can edit Consessions'
                                    : member.concessions_done
                                      ? 'Consessions Attended (Click to uncheck)'
                                      : 'Mark Consessions as Completed'
                                }
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${member.concessions_done
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs ring-2 ring-amber-500/20'
                                  : 'bg-white/80 dark:bg-zinc-800 border border-amber-300 dark:border-amber-800/80 hover:border-amber-500'
                                  } ${!permissions.canEditConcessions
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'active:scale-90 cursor-pointer'
                                  }`}
                              >
                                {isPendingConcessions ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                                ) : member.concessions_done ? (
                                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                                ) : null}
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Event Attendance Status Cells */}
                      {filteredEvents.map((ev) => {
                        const cellKey = `${ev.id}:${member.id}`;
                        const currentStatus = attendanceStatusMap.get(cellKey) || 'empty';
                        const isPending = pendingToggles.has(cellKey);
                        const canToggleEvent = permissions.isFullOfficer || permissions.canManageCategory(ev.type);

                        return (
                          <td
                            key={ev.id}
                            className="p-0 text-center border-r border-gray-200/80 dark:border-zinc-800 relative h-full"
                          >
                            <div className="absolute inset-0 w-full h-full">
                              <AttendanceStatusCell
                                status={currentStatus}
                                isPending={isPending}
                                disabled={!canToggleEvent}
                                onSelect={(newStatus) =>
                                  handleSetAttendanceStatus(ev.id, member.id, newStatus, ev.type)
                                }
                                title={
                                  !canToggleEvent
                                    ? `Only ${ev.type} chair or officers can update attendance for this event`
                                    : currentStatus === 'empty'
                                    ? `Record attendance for ${member.first_name || member.username}`
                                    : `Currently: ${currentStatus.toUpperCase()} (Click active letter to clear)`
                                }
                              />
                            </div>
                          </td>
                        );
                      })}

                      {/* Empty Placeholder for right Add Column */}
                      {permissions.canCreateEvents && (
                        <td className="p-2.5 border-r border-gray-100 dark:border-zinc-800" />
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Status & Excuses Modal */}
      <MemberStatusModal
        member={selectedMemberForStatus}
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedMemberForStatus(null);
        }}
        onUpdated={(updated) => {
          setMembers((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }}
        permissions={permissions}
      />

      {/* Create Event Modal */}
      {permissions.canCreateEvents && (
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onEventCreated={handleEventCreated}
          currentUserProfile={currentUserProfile}
        />
      )}

      {/* Event Details & Edit Modal */}
      <EventModal
        event={selectedEventForModal}
        isOpen={!!selectedEventForModal}
        totalMembersCount={members.length}
        currentUserProfile={currentUserProfile}
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

      {/* Export & Query Evaluation Modal */}
      <ExportQueryModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        members={members}
        events={events}
        records={records}
      />
    </div>
  );
}
