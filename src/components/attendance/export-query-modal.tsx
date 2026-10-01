'use client'

import React, { useState, useMemo } from 'react';
import { MemberProfile, AttendanceEvent, AttendanceRecord } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  Copy,
  Check,
  Filter,
  Users,
  Mail,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ExportQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  events: AttendanceEvent[];
  records: AttendanceRecord[];
}

export default function ExportQueryModal({
  isOpen,
  onClose,
  members,
  events,
  records,
}: ExportQueryModalProps) {
  // Query Filters State
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  const [duesFilter, setDuesFilter] = useState<string>('all');
  const [concessionsFilter, setConcessionsFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minPoints, setMinPoints] = useState<string>('');
  const [maxPoints, setMaxPoints] = useState<string>('');

  // Evaluation State
  const [evaluated, setEvaluated] = useState<boolean>(false);
  const [copiedNames, setCopiedNames] = useState<boolean>(false);
  const [copiedEmails, setCopiedEmails] = useState<boolean>(false);

  // Precompute pillar metrics for all members based on records and profile
  const memberPillarsMap = useMemo(() => {
    const map = new Map<
      string,
      { brotherhood: boolean; profDev: boolean; commService: boolean }
    >();

    // Initial pass from profile fields
    for (const m of members) {
      map.set(m.id, {
        brotherhood: !!m.brotherhood_met,
        profDev: !!m.prof_dev_met,
        commService: !!m.comm_service_met,
      });
    }

    // Dynamic pass from checked-off present events
    for (const r of records) {
      if (r.status === 'present') {
        const ev = events.find((e) => e.id === r.event_id);
        if (ev) {
          const t = ev.type.toLowerCase();
          const current = map.get(r.user_id) || {
            brotherhood: false,
            profDev: false,
            commService: false,
          };
          if (t === 'brotherhood' || t === 'alumni') current.brotherhood = true;
          if (t === 'pd' || t === 'professional' || t.includes('pd')) current.profDev = true;
          if (t === 'service' || t === 'community service' || t.includes('cleanup')) current.commService = true;
          map.set(r.user_id, current);
        }
      }
    }

    return map;
  }, [members, events, records]);

  // Compute matched members when evaluated
  const matchingMembers = useMemo(() => {
    if (!evaluated) return [];

    return members.filter((member) => {
      // 1. Pillar filter
      const pillars = memberPillarsMap.get(member.id) || {
        brotherhood: false,
        profDev: false,
        commService: false,
      };

      if (pillarFilter === 'missing_brotherhood' && pillars.brotherhood) return false;
      if (pillarFilter === 'missing_prof_dev' && pillars.profDev) return false;
      if (pillarFilter === 'missing_comm_service' && pillars.commService) return false;
      if (
        pillarFilter === 'missing_any' &&
        pillars.brotherhood &&
        pillars.profDev &&
        pillars.commService
      )
        return false;
      if (
        pillarFilter === 'missing_all' &&
        (pillars.brotherhood || pillars.profDev || pillars.commService)
      )
        return false;
      if (
        pillarFilter === 'all_met' &&
        (!pillars.brotherhood || !pillars.profDev || !pillars.commService)
      )
        return false;

      // 2. Dues filter
      if (duesFilter === 'missing' && (member.dues_paid || member.dues_excused)) return false;
      if (duesFilter === 'completed' && !member.dues_paid) return false;
      if (duesFilter === 'excused' && !member.dues_excused) return false;
      if (duesFilter === 'paid_or_excused' && !member.dues_paid && !member.dues_excused) return false;

      // 3. Consessions filter
      if (concessionsFilter === 'missing' && (member.concessions_done || member.concessions_excused))
        return false;
      if (concessionsFilter === 'completed' && !member.concessions_done) return false;
      if (concessionsFilter === 'excused' && !member.concessions_excused) return false;
      if (
        concessionsFilter === 'completed_or_excused' &&
        !member.concessions_done &&
        !member.concessions_excused
      )
        return false;

      // 4. Status filter
      if (statusFilter !== 'all') {
        const memberStatus = (member.status || 'ACTIVE').toUpperCase();
        if (statusFilter === 'ANY_ACTIVE') {
          if (memberStatus !== 'ACTIVE' && memberStatus !== 'ACTIVE_COOP') return false;
        } else if (memberStatus !== statusFilter) {
          return false;
        }
      }

      // 5. Points Above / Min Points
      if (minPoints !== '' && !isNaN(Number(minPoints))) {
        if (member.attendance_points < Number(minPoints)) return false;
      }

      // 6. Points Below / Max Points
      if (maxPoints !== '' && !isNaN(Number(maxPoints))) {
        if (member.attendance_points > Number(maxPoints)) return false;
      }

      return true;
    });
  }, [
    evaluated,
    members,
    pillarFilter,
    duesFilter,
    concessionsFilter,
    statusFilter,
    minPoints,
    maxPoints,
    memberPillarsMap,
  ]);

  // Extract lists
  const namesList = useMemo(() => {
    return matchingMembers.map((m) => {
      const first = (m.first_name || '').trim();
      const last = (m.last_name || '').trim();
      if (first && first !== 'TEMP' && last && last !== 'TEMP') {
        return `${first} ${last}`;
      }
      if (first && first !== 'TEMP') return first;
      if (last && last !== 'TEMP') return last;
      return m.username;
    });
  }, [matchingMembers]);

  const emailsList = useMemo(() => {
    return matchingMembers.map((m) => {
      if (m.email && m.email.trim()) return m.email.trim().toLowerCase();
      const u = (m.username || '').trim().toLowerCase();
      if (u.includes('@')) return u;
      return u ? `${u}@wisc.edu` : '';
    });
  }, [matchingMembers]);

  const handleEvaluate = () => {
    setEvaluated(true);
    setCopiedNames(false);
    setCopiedEmails(false);
  };

  const handleResetFilters = () => {
    setPillarFilter('all');
    setDuesFilter('all');
    setConcessionsFilter('all');
    setStatusFilter('all');
    setMinPoints('');
    setMaxPoints('');
    setEvaluated(false);
    setCopiedNames(false);
    setCopiedEmails(false);
  };

  const handleCopyNames = async () => {
    if (namesList.length === 0) return;
    try {
      await navigator.clipboard.writeText(namesList.join('\n'));
      setCopiedNames(true);
      setTimeout(() => setCopiedNames(false), 2000);
    } catch (err) {
      console.error('Failed to copy names:', err);
    }
  };

  const handleCopyEmails = async () => {
    if (emailsList.length === 0) return;
    try {
      await navigator.clipboard.writeText(emailsList.join('\n'));
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2000);
    } catch (err) {
      console.error('Failed to copy emails:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white p-5 sm:p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Download className="h-5 w-5 text-red-600 dark:text-red-500" />
            <span>Export &amp; Member Query</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 text-xs">
            Filter chapter members by requirements, standing, and point thresholds to generate clean lists for communications and audits.
          </DialogDescription>
        </DialogHeader>

        {/* Filter Configuration Grid */}
        <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200/80 dark:border-zinc-700/80 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span>Query Criteria</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-6 px-2 text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* 1. Missing Pillar */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Pillar Requirements
              </Label>
              <select
                value={pillarFilter}
                onChange={(e) => setPillarFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">Any / Ignore Pillars</option>
                <option value="missing_brotherhood">Missing Brotherhood</option>
                <option value="missing_prof_dev">Missing Professional Dev</option>
                <option value="missing_comm_service">Missing Community Service</option>
                <option value="missing_any">Missing Any Pillar</option>
                <option value="missing_all">Missing All Pillars</option>
                <option value="all_met">All 3 Pillars Met</option>
              </select>
            </div>

            {/* 2. Dues */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Dues Status
              </Label>
              <select
                value={duesFilter}
                onChange={(e) => setDuesFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">Any / Ignore Dues</option>
                <option value="missing">Missing / Unpaid (Not Excused)</option>
                <option value="completed">Completed / Paid</option>
                <option value="excused">Excused Dues</option>
                <option value="paid_or_excused">Paid or Excused</option>
              </select>
            </div>

            {/* 3. Consessions */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Consessions Status
              </Label>
              <select
                value={concessionsFilter}
                onChange={(e) => setConcessionsFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">Any / Ignore Consessions</option>
                <option value="missing">Missing / Pending (Not Excused)</option>
                <option value="completed">Completed / Attended</option>
                <option value="excused">Excused Consessions</option>
                <option value="completed_or_excused">Completed or Excused</option>
              </select>
            </div>

            {/* 4. Member Status */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Member Standing
              </Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">Any / All Members</option>
                <option value="ANY_ACTIVE">Active Members Only (Active + Co-op)</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ACTIVE_COOP">ACTIVE_COOP</option>
                <option value="INACTIVE_COOP">INACTIVE_COOP</option>
                <option value="ABROAD">ABROAD</option>
                <option value="ALUMNI">ALUMNI</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            {/* 5. Points Above (Min) & Below (Max) */}
            <div className="space-y-1 sm:col-span-2 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Attendance Points Threshold
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min points (above)"
                  value={minPoints}
                  onChange={(e) => setMinPoints(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                />
                <span className="text-gray-400 text-xs font-bold">to</span>
                <Input
                  type="number"
                  placeholder="Max points (below)"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Evaluate Action Button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={handleEvaluate}
              className="bg-red-700 hover:bg-red-800 text-white font-bold h-10 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Evaluate</span>
            </Button>
          </div>
        </div>

        {/* Evaluation Output Section */}
        {evaluated && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-zinc-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Evaluation Results:
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900">
                {matchingMembers.length} member{matchingMembers.length === 1 ? '' : 's'} matched
              </span>
            </div>

            {matchingMembers.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-zinc-800/30 rounded-xl border border-gray-200/60 dark:border-zinc-800 text-gray-400 text-xs italic">
                No members match all of the selected criteria. Try adjusting the thresholds.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* List 1: Names */}
                <div className="flex flex-col bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                  <div className="p-2.5 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700/80 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      <span>Names ({namesList.length})</span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyNames}
                      className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-white dark:bg-zinc-700 text-gray-800 dark:text-white border border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600 flex items-center gap-1 shadow-2xs"
                    >
                      {copiedNames ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-gray-500" />
                          <span>Copy All</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-3 max-h-60 overflow-y-auto font-mono text-xs text-gray-800 dark:text-gray-200 space-y-1 select-all whitespace-pre-line leading-relaxed">
                    {namesList.map((name, idx) => (
                      <div key={idx} className="hover:bg-white/60 dark:hover:bg-zinc-700/40 px-1 rounded">
                        {name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* List 2: Emails */}
                <div className="flex flex-col bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                  <div className="p-2.5 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700/80 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      <span>Emails ({emailsList.length})</span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyEmails}
                      className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-white dark:bg-zinc-700 text-gray-800 dark:text-white border border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600 flex items-center gap-1 shadow-2xs"
                    >
                      {copiedEmails ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-gray-500" />
                          <span>Copy All</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-3 max-h-60 overflow-y-auto font-mono text-xs text-gray-800 dark:text-gray-200 space-y-1 select-all whitespace-pre-line leading-relaxed">
                    {emailsList.map((email, idx) => (
                      <div key={idx} className="hover:bg-white/60 dark:hover:bg-zinc-700/40 px-1 rounded">
                        {email}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
