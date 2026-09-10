'use client'

import React, { useState, useMemo } from 'react';
import { AttendanceEvent, AttendanceRecord, MemberProfile, EventCategory } from './types';
import { Calendar, CheckCircle2, XCircle, QrCode, Search, Radio, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface MemberAttendanceViewProps {
  profile: MemberProfile | null;
  events: AttendanceEvent[];
  records: AttendanceRecord[];
}

export default function MemberAttendanceView({
  profile,
  events,
  records,
}: MemberAttendanceViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventCategory>('all');

  const attendedEventIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.status === 'present') {
        set.add(r.event_id);
      }
    }
    return set;
  }, [records]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (search.trim() && !ev.name.toLowerCase().includes(search.toLowerCase().trim())) {
          return false;
        }
        if (typeFilter !== 'all' && ev.type.toLowerCase() !== typeFilter.toLowerCase()) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
  }, [events, search, typeFilter]);

  const totalAttendedCount = attendedEventIds.size;
  const activeEventsCount = events.filter((e) => e.is_active).length;
  const currentPoints = profile?.attendance_points || 0;

  const displayName = profile?.first_name && profile.first_name !== 'TEMP'
    ? `${profile.first_name} ${profile.last_name || ''}`
    : profile?.username || 'Brother';

  return (
    <div className="space-y-6">
      {/* Member Score Hero Card */}
      <div className="bg-gradient-to-br from-red-900 via-red-950 to-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-red-800/40 relative overflow-hidden">
        {/* Background Decorative Crest/Shape */}
        <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-red-300 text-xs font-bold uppercase tracking-widest">
              <Shield className="h-4 w-4" />
              Theta Tau Xi Chapter • Personal Attendance
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
              {displayName}
            </h1>
            <p className="text-red-200/80 text-xs sm:text-sm mt-1 max-w-lg">
              Your chapter attendance history and point accrual. Point values contribute directly to your active member standing and semester requirements.
            </p>
          </div>

          {/* Points Counter Badge */}
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl text-center min-w-[150px]">
            <div className="text-4xl sm:text-5xl font-black text-white leading-none">
              {currentPoints}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-red-200 mt-1">
              POINTS
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs sm:text-sm">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-red-300 text-xs uppercase font-semibold">Events Attended</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalAttendedCount}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-red-300 text-xs uppercase font-semibold">Total Chapter Events</div>
            <div className="text-xl font-bold text-white mt-0.5">{events.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-red-300 text-xs uppercase font-semibold">Open for Scan</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <Radio className="h-4 w-4 animate-pulse" />
              {activeEventsCount} Active
            </div>
          </div>
        </div>
      </div>

      {/* Read-Only Informational Callout */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <QrCode className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span>
            <strong>How to check in:</strong> Scan the QR code displayed by the Scribe on the projector during meetings. Attendance will instantly appear on this page.
          </span>
        </div>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
          Read-Only Mode
        </span>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-xs sm:text-sm h-10"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as EventCategory)}
          className="w-full sm:w-48 h-10 px-3 py-2 text-xs sm:text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          <option value="all">All Event Types</option>
          <option value="rush">Rush</option>
          <option value="general">General Chapter</option>
          <option value="brotherhood">Brotherhood</option>
          <option value="professional">Professional Dev</option>
          <option value="service">Community Service</option>
          <option value="concessions">Concessions</option>
        </select>
      </div>

      {/* Personal Attendance List */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Event Attendance History
          </h2>
          <span className="text-xs text-gray-400">
            {filteredEvents.length} events
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          {filteredEvents.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-xs italic">
              No chapter events match your search.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isAttended = attendedEventIds.has(ev.id);
              return (
                <div
                  key={ev.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                        {ev.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700">
                        {ev.type}
                      </span>
                      {ev.is_active && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Open for check-in
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {ev.date}
                      </span>
                      <span>•</span>
                      <span>
                        Value: {ev.points === 0 ? '0 points (Rush)' : `${ev.points} pt${ev.points > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>

                  {/* Member Attendance Status */}
                  <div className="flex items-center self-start sm:self-auto">
                    {isAttended ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60 text-green-700 dark:text-green-400 font-bold text-xs">
                        <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                        <span>Present</span>
                        {ev.points > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-md bg-green-200/60 dark:bg-green-900/60 text-green-800 dark:text-green-300 text-[10px]">
                            +{ev.points} pts
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-200 dark:border-zinc-700">
                        <XCircle className="h-4 w-4" />
                        <span>Not Recorded</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
