'use client'

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileSpreadsheet,
  Filter,
  Mail,
  RotateCcw,
  Search,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import DistributionPieChart from '@/components/roster/distribution-pie-chart';
import {
  DistributionDimension,
  RosterMember,
  UNASSIGNED_LABEL,
  buildRosterCsv,
  comparePledgeClasses,
  formatMemberStatus,
} from '@/lib/roster-utils';

interface RosterClientProps {
  initialMembers: RosterMember[];
  error?: string;
}

type SortField =
  | 'name'
  | 'roster_type'
  | 'role'
  | 'email'
  | 'pledge_class'
  | 'graduation_year'
  | 'major'
  | 'status'
  | 'attendance_points';

type SortDirection = 'asc' | 'desc';

function getStandingBadgeClasses(status: string): string {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
    case 'ACTIVE_COOP':
      return 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/60';
    case 'INACTIVE_COOP':
      return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
    case 'ABROAD':
      return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
    default:
      return 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700';
  }
}

export default function RosterClient({ initialMembers, error }: RosterClientProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Active' | 'PNM'>('all');
  const [pledgeClassFilter, setPledgeClassFilter] = useState<string>('all');
  const [gradYearFilter, setGradYearFilter] = useState<string>('all');
  const [majorFilter, setMajorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pie Chart state
  const [chartDimension, setChartDimension] = useState<DistributionDimension>('major');
  const [chartScope, setChartScope] = useState<'filtered' | 'all'>('filtered');

  // Export & Copy feedback states
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [copiedRowEmailId, setCopiedRowEmailId] = useState<string | null>(null);

  // Distinct filter options derived from initialMembers
  const filterOptions = useMemo(() => {
    const pledgeSet = new Set<string>();
    const yearSet = new Set<number>();
    const majorSet = new Set<string>();
    const statusSet = new Set<string>();
    const roleSet = new Set<string>();

    let hasUnassignedPledge = false;
    let hasUnassignedYear = false;
    let hasUnassignedMajor = false;

    for (const m of initialMembers) {
      if (m.pledge_class) pledgeSet.add(m.pledge_class);
      else hasUnassignedPledge = true;

      if (m.graduation_year) yearSet.add(m.graduation_year);
      else hasUnassignedYear = true;

      if (m.major) majorSet.add(m.major);
      else hasUnassignedMajor = true;

      statusSet.add((m.status || 'ACTIVE').toUpperCase());
      roleSet.add(m.role || 'Member');
    }

    return {
      pledgeClasses: Array.from(pledgeSet).sort(comparePledgeClasses),
      hasUnassignedPledge,
      gradYears: Array.from(yearSet).sort((a, b) => a - b),
      hasUnassignedYear,
      majors: Array.from(majorSet).sort((a, b) => a.localeCompare(b)),
      hasUnassignedMajor,
      statuses: Array.from(statusSet).sort(),
      roles: Array.from(roleSet).sort((a, b) => a.localeCompare(b)),
    };
  }, [initialMembers]);

  // Overall counts
  const overallCounts = useMemo(() => {
    let active = 0;
    let pnm = 0;
    for (const m of initialMembers) {
      if (m.roster_type === 'PNM') pnm++;
      else active++;
    }
    return { total: initialMembers.length, active, pnm };
  }, [initialMembers]);

  const isAnyFilterActive =
    searchTerm.trim() !== '' ||
    typeFilter !== 'all' ||
    pledgeClassFilter !== 'all' ||
    gradYearFilter !== 'all' ||
    majorFilter !== 'all' ||
    statusFilter !== 'all' ||
    roleFilter !== 'all';

  // Filtered and sorted roster
  const filteredAndSortedMembers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const filtered = initialMembers.filter((m) => {
      if (typeFilter !== 'all' && m.roster_type !== typeFilter) return false;

      if (pledgeClassFilter !== 'all') {
        if (pledgeClassFilter === UNASSIGNED_LABEL) {
          if (m.pledge_class) return false;
        } else if (m.pledge_class !== pledgeClassFilter) {
          return false;
        }
      }

      if (gradYearFilter !== 'all') {
        if (gradYearFilter === UNASSIGNED_LABEL) {
          if (m.graduation_year !== null) return false;
        } else if (String(m.graduation_year) !== gradYearFilter) {
          return false;
        }
      }

      if (majorFilter !== 'all') {
        if (majorFilter === UNASSIGNED_LABEL) {
          if (m.major) return false;
        } else if (m.major !== majorFilter) {
          return false;
        }
      }

      if (statusFilter !== 'all' && m.status.toUpperCase() !== statusFilter) return false;
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;

      if (term) {
        const haystack = [
          m.full_name,
          m.username,
          m.email,
          m.role,
          m.roster_type,
          m.major || '',
          m.pledge_class || '',
          m.graduation_year ? String(m.graduation_year) : '',
          formatMemberStatus(m.status),
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(term)) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;

      switch (sortField) {
        case 'name': {
          const aKey = `${a.last_name || a.full_name} ${a.first_name || ''}`.toLowerCase();
          const bKey = `${b.last_name || b.full_name} ${b.first_name || ''}`.toLowerCase();
          cmp = aKey.localeCompare(bKey);
          break;
        }
        case 'roster_type':
          cmp = a.roster_type.localeCompare(b.roster_type);
          break;
        case 'role':
          cmp = a.role.localeCompare(b.role);
          break;
        case 'email':
          cmp = a.email.localeCompare(b.email);
          break;
        case 'pledge_class':
          cmp = comparePledgeClasses(a.pledge_class, b.pledge_class);
          break;
        case 'graduation_year': {
          const aYr = a.graduation_year ?? Number.MAX_SAFE_INTEGER;
          const bYr = b.graduation_year ?? Number.MAX_SAFE_INTEGER;
          cmp = aYr - bYr;
          break;
        }
        case 'major': {
          const aMaj = a.major || '\uffff';
          const bMaj = b.major || '\uffff';
          cmp = aMaj.localeCompare(bMaj);
          break;
        }
        case 'status':
          cmp = formatMemberStatus(a.status).localeCompare(formatMemberStatus(b.status));
          break;
        case 'attendance_points':
          cmp = a.attendance_points - b.attendance_points;
          break;
      }

      if (cmp === 0) {
        cmp = a.full_name.localeCompare(b.full_name);
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [
    initialMembers,
    searchTerm,
    typeFilter,
    pledgeClassFilter,
    gradYearFilter,
    majorFilter,
    statusFilter,
    roleFilter,
    sortField,
    sortDirection,
  ]);

  const filteredCounts = useMemo(() => {
    let active = 0;
    let pnm = 0;
    let pending = 0;
    for (const m of filteredAndSortedMembers) {
      if (m.roster_type === 'PNM') pnm++;
      else active++;
      if (m.is_pending_setup) pending++;
    }
    return { total: filteredAndSortedMembers.length, active, pnm, pending };
  }, [filteredAndSortedMembers]);

  // Active slice filter value matching current chartDimension
  const activeChartFilterValue = useMemo(() => {
    switch (chartDimension) {
      case 'pledge_class':
        return pledgeClassFilter === 'all' ? null : pledgeClassFilter;
      case 'graduation_year':
        return gradYearFilter === 'all' ? null : gradYearFilter;
      case 'major':
        return majorFilter === 'all' ? null : majorFilter;
      case 'roster_type':
        return typeFilter === 'all' ? null : typeFilter;
      case 'status':
        return statusFilter === 'all' ? null : statusFilter;
      case 'role':
        return roleFilter === 'all' ? null : roleFilter;
    }
  }, [
    chartDimension,
    pledgeClassFilter,
    gradYearFilter,
    majorFilter,
    typeFilter,
    statusFilter,
    roleFilter,
  ]);

  const handleSortColumn = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'attendance_points' ? 'desc' : 'asc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setPledgeClassFilter('all');
    setGradYearFilter('all');
    setMajorFilter('all');
    setStatusFilter('all');
    setRoleFilter('all');
  };

  // Toggle filter when user clicks a pie chart slice or legend item
  const handleChartSliceClick = (dimension: DistributionDimension, rawValue: string) => {
    switch (dimension) {
      case 'pledge_class':
        setPledgeClassFilter((prev) => (prev === rawValue ? 'all' : rawValue));
        break;
      case 'graduation_year':
        setGradYearFilter((prev) => (prev === rawValue ? 'all' : rawValue));
        break;
      case 'major':
        setMajorFilter((prev) => (prev === rawValue ? 'all' : rawValue));
        break;
      case 'roster_type':
        setTypeFilter((prev) =>
          prev === rawValue ? 'all' : (rawValue as 'Active' | 'PNM')
        );
        break;
      case 'status':
        setStatusFilter((prev) => (prev === rawValue ? 'all' : rawValue));
        break;
      case 'role':
        setRoleFilter((prev) => (prev === rawValue ? 'all' : rawValue));
        break;
    }
  };

  // Export handlers
  const handleExportCsv = () => {
    if (filteredAndSortedMembers.length === 0) return;
    const csvContent = buildRosterCsv(filteredAndSortedMembers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `theta_tau_member_roster_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const triggerCopyFeedback = (label: string) => {
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2200);
  };

  const handleCopyText = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      triggerCopyFeedback(label);
      setExportMenuOpen(false);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleCopyFilteredEmails = (separator: ', ' | '\n', label: string) => {
    const emails = filteredAndSortedMembers
      .map((m) => m.email)
      .filter(Boolean)
      .join(separator);
    handleCopyText(emails, label);
  };

  const handleCopyFilteredNames = () => {
    const names = filteredAndSortedMembers.map((m) => m.full_name).join('\n');
    handleCopyText(names, 'Copied Names!');
  };

  const handleCopySingleEmail = async (id: string, email: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiedRowEmailId(id);
      setTimeout(() => setCopiedRowEmailId(null), 1600);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-red-700 dark:text-red-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-red-700 dark:text-red-400" />
    );
  };

  const chartMembers =
    chartScope === 'filtered' ? filteredAndSortedMembers : initialMembers;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black text-gray-900 dark:text-white pb-20">
      {/* Sticky Top Header */}
      <div className="border-b border-gray-200/60 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/members-only"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Back to Member Portal"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                  <Users className="h-4 w-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Member Roster
                </h1>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Xi Chapter Active &amp; PNM Directory ({overallCounts.active} Active{overallCounts.active === 1 ? '' : 's'}, {overallCounts.pnm} PNM{overallCounts.pnm === 1 ? '' : 's'})
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredAndSortedMembers.length === 0}
              onClick={() => handleCopyFilteredEmails(', ', 'Copied Emails!')}
              className="h-9 px-3 text-xs border-gray-200 dark:border-zinc-700 flex items-center gap-1.5"
            >
              {copyFeedback ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {copyFeedback}
                  </span>
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  <span>Copy Emails ({filteredCounts.total})</span>
                </>
              )}
            </Button>

            <div className="relative flex items-center">
              <Button
                type="button"
                size="sm"
                disabled={filteredAndSortedMembers.length === 0}
                onClick={handleExportCsv}
                className="h-9 px-3.5 bg-red-800 hover:bg-red-700 text-white font-semibold text-xs rounded-l-xl rounded-r-none shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV ({filteredCounts.total})</span>
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={filteredAndSortedMembers.length === 0}
                onClick={() => setExportMenuOpen((prev) => !prev)}
                aria-label="More export options"
                className="h-9 px-2 bg-red-900 hover:bg-red-800 text-white rounded-r-xl rounded-l-none border-l border-red-700/60"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>

              {exportMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close export menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-11 w-60 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 z-40">
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-red-700 dark:text-red-400" />
                      <span>Download Filtered CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyFilteredEmails(', ', 'Copied Comma List!')}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Mail className="h-3.5 w-3.5 text-gray-500" />
                      <span>Copy Emails (comma-separated)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyFilteredEmails('\n', 'Copied Line List!')}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                      <span>Copy Emails (one per line)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyFilteredNames}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Users className="h-3.5 w-3.5 text-gray-500" />
                      <span>Copy Names (one per line)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Distribution Pie Chart at the top */}
        <DistributionPieChart
          members={chartMembers}
          totalRosterCount={initialMembers.length}
          isFiltered={isAnyFilterActive}
          scope={chartScope}
          onScopeChange={setChartScope}
          dimension={chartDimension}
          onDimensionChange={setChartDimension}
          activeFilterValue={activeChartFilterValue}
          onSliceClick={handleChartSliceClick}
        />

        {/* Quick Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Showing
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5 tabular-nums">
              {filteredCounts.total}
              <span className="text-xs font-medium text-gray-400 ml-1">/ {overallCounts.total}</span>
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Active Members
            </p>
            <p className="text-2xl font-black text-red-800 dark:text-red-400 mt-0.5 tabular-nums">
              {filteredCounts.active}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              PNMs
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
              {filteredCounts.pnm}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Distinct Majors
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5 tabular-nums">
              {
                new Set(
                  filteredAndSortedMembers.map((m) => m.major).filter(Boolean)
                ).size
              }
            </p>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Bar: Search + Active/PNM Type Tabs + Reset */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, NetID, email, major, pledge class, role..."
                className="pl-10 text-xs bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 h-9 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-xl bg-gray-100 dark:bg-zinc-800 p-0.5 border border-gray-200 dark:border-zinc-700">
                {(
                  [
                    { id: 'all', label: `All (${overallCounts.total})` },
                    { id: 'Active', label: `Active (${overallCounts.active})` },
                    { id: 'PNM', label: `PNMs (${overallCounts.pnm})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTypeFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      typeFilter === tab.id
                        ? 'bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 shadow-2xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {isAnyFilterActive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-3 text-xs text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset Filters
                </Button>
              )}
            </div>
          </div>

          {/* Dropdown Filters & Mobile Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Pledge Class
              </Label>
              <select
                value={pledgeClassFilter}
                onChange={(e) => setPledgeClassFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Pledge Classes</option>
                {filterOptions.pledgeClasses.map((pc) => (
                  <option key={pc} value={pc}>
                    {pc}
                  </option>
                ))}
                {filterOptions.hasUnassignedPledge && (
                  <option value={UNASSIGNED_LABEL}>Unassigned</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Grad Year
              </Label>
              <select
                value={gradYearFilter}
                onChange={(e) => setGradYearFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Years</option>
                {filterOptions.gradYears.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}
                  </option>
                ))}
                {filterOptions.hasUnassignedYear && (
                  <option value={UNASSIGNED_LABEL}>Unassigned</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Major
              </Label>
              <select
                value={majorFilter}
                onChange={(e) => setMajorFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Majors</option>
                {filterOptions.majors.map((maj) => (
                  <option key={maj} value={maj}>
                    {maj}
                  </option>
                ))}
                {filterOptions.hasUnassignedMajor && (
                  <option value={UNASSIGNED_LABEL}>Unassigned</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Standing
              </Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Standings</option>
                {filterOptions.statuses.map((st) => (
                  <option key={st} value={st}>
                    {formatMemberStatus(st)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Role
              </Label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Roles</option>
                {filterOptions.roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Sort By
              </Label>
              <div className="flex items-center gap-1.5">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="flex-1 h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="name">Name (Last)</option>
                  <option value="role">Role</option>
                  <option value="email">Email</option>
                  <option value="pledge_class">Pledge Class</option>
                  <option value="graduation_year">Grad Year</option>
                  <option value="major">Major</option>
                  <option value="status">Standing</option>
                  <option value="attendance_points">Points</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  aria-label={`Sort direction: ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                  title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Roster Display */}
        {filteredAndSortedMembers.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-12 text-center text-gray-400 space-y-3">
            <Users className="h-10 w-10 mx-auto text-gray-300 dark:text-zinc-700" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              No members match your filters
            </p>
            <p className="text-xs">
              Try clearing a filter or searching with a different name, NetID, major, or pledge class.
            </p>
            {isAnyFilterActive && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-2 rounded-xl text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('name')}
                          className="group inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                        >
                          <span>Name</span>
                          {renderSortIcon('name')}
                        </button>
                      </th>
                      <th className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('role')}
                          className="group inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                        >
                          <span>Role</span>
                          {renderSortIcon('role')}
                        </button>
                      </th>
                      <th className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('email')}
                          className="group inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                        >
                          <span>Email</span>
                          {renderSortIcon('email')}
                        </button>
                      </th>
                      <th className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('pledge_class')}
                          className="group inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                        >
                          <span>Pledge Class</span>
                          {renderSortIcon('pledge_class')}
                        </button>
                      </th>
                      <th className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('graduation_year')}
                          className="group inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                        >
                          <span>Year</span>
                          {renderSortIcon('graduation_year')}
                        </button>
                      </th>
                      <th className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('major')}
                          className="group inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                        >
                          <span>Major</span>
                          {renderSortIcon('major')}
                        </button>
                      </th>
                      <th className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('status')}
                          className="group inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                        >
                          <span>Standing</span>
                          {renderSortIcon('status')}
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('attendance_points')}
                          className="group inline-flex items-center justify-end gap-1 hover:text-gray-900 dark:hover:text-white"
                        >
                          <span>Pts</span>
                          {renderSortIcon('attendance_points')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80 text-xs">
                    {filteredAndSortedMembers.map((member) => {
                      const initials = member.is_pending_setup
                        ? (member.username.slice(0, 2) || '?').toUpperCase()
                        : `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase();

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-gray-50/90 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          {/* Name + NetID */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                  member.roster_type === 'PNM'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                    : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <span className="truncate">{member.full_name}</span>
                                  {member.is_pending_setup && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400">
                                      Pending
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono truncate">
                                  @{member.username || 'unknown'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                member.roster_type === 'PNM'
                                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                                  : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60'
                              }`}
                            >
                              {member.role}
                            </span>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-3">
                            {member.email ? (
                              <div className="flex items-center gap-1.5 group max-w-[230px]">
                                <a
                                  href={`mailto:${member.email}`}
                                  className="text-red-700 dark:text-red-400 hover:underline truncate font-medium"
                                >
                                  {member.email}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopySingleEmail(member.id, member.email)}
                                  title="Copy email"
                                  aria-label={`Copy email for ${member.full_name}`}
                                  className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                                >
                                  {copiedRowEmailId === member.id ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Pledge Class */}
                          <td className="py-3 px-3 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                            {member.pledge_class || <span className="text-gray-400">—</span>}
                          </td>

                          {/* Grad Year */}
                          <td className="py-3 px-3 whitespace-nowrap text-gray-700 dark:text-gray-300 tabular-nums">
                            {member.graduation_year || <span className="text-gray-400">—</span>}
                          </td>

                          {/* Major */}
                          <td className="py-3 px-3 text-gray-700 dark:text-gray-300 max-w-[210px]">
                            <span className="line-clamp-2">
                              {member.major || <span className="text-gray-400">—</span>}
                            </span>
                          </td>

                          {/* Standing */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStandingBadgeClasses(
                                member.status
                              )}`}
                            >
                              {formatMemberStatus(member.status)}
                            </span>
                          </td>

                          {/* Points */}
                          <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                            {member.attendance_points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {filteredAndSortedMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>{member.full_name}</span>
                        {member.is_pending_setup && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-gray-400">
                        @{member.username || 'unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          member.roster_type === 'PNM'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                            : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60'
                        }`}
                      >
                        {member.role}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStandingBadgeClasses(
                          member.status
                        )}`}
                      >
                        {formatMemberStatus(member.status)}
                      </span>
                    </div>
                  </div>

                  {member.email && (
                    <div className="flex items-center justify-between gap-2 text-xs bg-gray-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl">
                      <a
                        href={`mailto:${member.email}`}
                        className="text-red-700 dark:text-red-400 font-medium truncate"
                      >
                        {member.email}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopySingleEmail(member.id, member.email)}
                        className="text-gray-500 hover:text-gray-900 dark:hover:text-white shrink-0"
                        aria-label={`Copy email for ${member.full_name}`}
                      >
                        {copiedRowEmailId === member.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600 dark:text-gray-300 pt-1">
                    <div>
                      <span className="text-gray-400 block">Pledge Class</span>
                      <span className="font-semibold">{member.pledge_class || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Grad Year</span>
                      <span className="font-semibold">{member.graduation_year || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block">Points</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {member.attendance_points}
                      </span>
                    </div>
                  </div>

                  {member.major && (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-zinc-800 pt-2">
                      Major: <strong className="text-gray-700 dark:text-gray-200">{member.major}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
