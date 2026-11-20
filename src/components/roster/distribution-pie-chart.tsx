'use client'

import React, { useMemo, useState } from 'react';
import { PieChart as PieChartIcon, Filter } from 'lucide-react';
import {
  RosterMember,
  DistributionDimension,
  UNASSIGNED_LABEL,
  comparePledgeClasses,
  formatMemberStatus,
} from '@/lib/roster-utils';

interface DistributionPieChartProps {
  members: RosterMember[];
  totalRosterCount: number;
  isFiltered: boolean;
  scope: 'filtered' | 'all';
  onScopeChange: (scope: 'filtered' | 'all') => void;
  dimension: DistributionDimension;
  onDimensionChange: (dimension: DistributionDimension) => void;
  activeFilterValue: string | null;
  onSliceClick: (dimension: DistributionDimension, rawValue: string) => void;
}

interface ChartSlice {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

const DIMENSION_OPTIONS: Array<{ id: DistributionDimension; label: string }> = [
  { id: 'pledge_class', label: 'Pledge Class' },
  { id: 'graduation_year', label: 'Grad Year' },
  { id: 'major', label: 'Major' },
  { id: 'roster_type', label: 'Active vs PNM' },
  { id: 'status', label: 'Standing' },
  { id: 'role', label: 'Role' },
];

const CHART_COLORS = [
  '#991b1b', // Theta Tau Maroon
  '#d97706', // Amber Gold
  '#2563eb', // Cobalt Blue
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#0891b2', // Cyan
  '#e11d48', // Crimson Rose
  '#65a30d', // Lime
  '#ea580c', // Burnt Orange
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#c026d3', // Fuchsia
  '#ca8a04', // Ochre
  '#475569', // Slate
];

const UNASSIGNED_COLOR = '#9ca3af';

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function createDonutSlicePath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', outerStart.x, outerStart.y,
    'A', outerR, outerR, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
    'L', innerEnd.x, innerEnd.y,
    'A', innerR, innerR, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
    'Z',
  ].join(' ');
}

/**
 * Extracts the raw grouping key and human-readable label for a member and dimension.
 */
function getMemberDimensionEntry(
  member: RosterMember,
  dimension: DistributionDimension
): { key: string; label: string } {
  switch (dimension) {
    case 'pledge_class': {
      const val = member.pledge_class?.trim();
      return val ? { key: val, label: val } : { key: UNASSIGNED_LABEL, label: UNASSIGNED_LABEL };
    }
    case 'graduation_year': {
      if (member.graduation_year) {
        const str = String(member.graduation_year);
        return { key: str, label: `Class of ${str}` };
      }
      return { key: UNASSIGNED_LABEL, label: UNASSIGNED_LABEL };
    }
    case 'major': {
      const val = member.major?.trim();
      return val ? { key: val, label: val } : { key: UNASSIGNED_LABEL, label: UNASSIGNED_LABEL };
    }
    case 'roster_type': {
      return {
        key: member.roster_type,
        label: member.roster_type === 'PNM' ? 'PNMs' : 'Active Members',
      };
    }
    case 'status': {
      const code = (member.status || 'ACTIVE').toUpperCase();
      return { key: code, label: formatMemberStatus(code) };
    }
    case 'role': {
      const val = member.role?.trim() || 'Member';
      return { key: val, label: val };
    }
  }
}

export default function DistributionPieChart({
  members,
  totalRosterCount,
  isFiltered,
  scope,
  onScopeChange,
  dimension,
  onDimensionChange,
  activeFilterValue,
  onSliceClick,
}: DistributionPieChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const slices: ChartSlice[] = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();

    for (const member of members) {
      const { key, label } = getMemberDimensionEntry(member, dimension);
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { label, count: 1 });
      }
    }

    const entries = Array.from(counts.entries()).map(([key, info]) => ({
      key,
      label: info.label,
      count: info.count,
    }));

    entries.sort((a, b) => {
      if (a.key === UNASSIGNED_LABEL && b.key !== UNASSIGNED_LABEL) return 1;
      if (b.key === UNASSIGNED_LABEL && a.key !== UNASSIGNED_LABEL) return -1;

      if (dimension === 'pledge_class') {
        return comparePledgeClasses(a.key, b.key);
      }
      if (dimension === 'graduation_year') {
        return Number(a.key) - Number(b.key);
      }
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.label.localeCompare(b.label);
    });

    const total = members.length || 1;
    let colorIdx = 0;

    return entries.map((entry) => {
      const color =
        entry.key === UNASSIGNED_LABEL
          ? UNASSIGNED_COLOR
          : CHART_COLORS[colorIdx++ % CHART_COLORS.length];

      return {
        ...entry,
        percentage: (entry.count / total) * 100,
        color,
      };
    });
  }, [members, dimension]);

  const hoveredSlice = useMemo(
    () => slices.find((s) => s.key === hoveredKey) || null,
    [slices, hoveredKey]
  );

  // Compute SVG geometry
  const cx = 120;
  const cy = 120;
  const baseOuterR = 94;
  const hoveredOuterR = 101;
  const innerR = 50;

  const arcSlices = useMemo(() => {
    const total = members.length;
    if (total === 0) return [];

    let currentAngle = 0;
    return slices.map((slice) => {
      const sweep = (slice.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      currentAngle = endAngle;
      return {
        ...slice,
        startAngle,
        endAngle,
      };
    });
  }, [slices, members.length]);

  const activeDimLabel = DIMENSION_OPTIONS.find((d) => d.id === dimension)?.label || 'Distribution';

  return (
    <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 shrink-0">
            <PieChartIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
                Member Distribution by {activeDimLabel}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                {members.length} {members.length === 1 ? 'person' : 'people'} • {slices.length}{' '}
                {slices.length === 1 ? 'group' : 'groups'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Hover a slice for details or click any segment to filter the roster table below.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Toggle (visible when table filters are active) */}
          {isFiltered && (
            <div className="inline-flex items-center rounded-xl bg-gray-100 dark:bg-zinc-800 p-0.5 border border-gray-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => onScopeChange('filtered')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  scope === 'filtered'
                    ? 'bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Filtered
              </button>
              <button
                type="button"
                onClick={() => onScopeChange('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  scope === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Full Roster ({totalRosterCount})
              </button>
            </div>
          )}

          {/* Dimension Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Distribution category">
            {DIMENSION_OPTIONS.map((opt) => {
              const isSelected = dimension === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onDimensionChange(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-red-800 text-white border-red-800 dark:bg-red-700 dark:border-red-700 shadow-xs'
                      : 'bg-gray-50 dark:bg-zinc-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart + Legend Body */}
      {members.length === 0 ? (
        <div className="py-12 text-center text-gray-400 space-y-1">
          <PieChartIcon className="h-9 w-9 mx-auto text-gray-300 dark:text-zinc-700" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No members in current view</p>
          <p className="text-xs">Adjust or clear filters to view the distribution chart.</p>
        </div>
      ) : (
        <div className="pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* SVG Pie / Donut Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-[240px] h-[240px]">
              <svg
                viewBox="0 0 240 240"
                className="w-full h-full overflow-visible"
                role="img"
                aria-label={`Pie chart showing member distribution by ${activeDimLabel}`}
              >
                {arcSlices.length === 1 ? (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={(baseOuterR + innerR) / 2}
                    fill="none"
                    stroke={arcSlices[0].color}
                    strokeWidth={
                      hoveredKey === arcSlices[0].key || activeFilterValue === arcSlices[0].key
                        ? hoveredOuterR - innerR
                        : baseOuterR - innerR
                    }
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredKey(arcSlices[0].key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onClick={() => onSliceClick(dimension, arcSlices[0].key)}
                  />
                ) : (
                  arcSlices.map((slice) => {
                    const isHovered = hoveredKey === slice.key;
                    const isSelectedFilter = activeFilterValue === slice.key;
                    const outerR = isHovered || isSelectedFilter ? hoveredOuterR : baseOuterR;
                    const isDimmed = hoveredKey !== null && !isHovered;

                    return (
                      <path
                        key={slice.key}
                        d={createDonutSlicePath(cx, cy, outerR, innerR, slice.startAngle, slice.endAngle)}
                        fill={slice.color}
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className={`text-white dark:text-zinc-900 cursor-pointer transition-all duration-150 ${
                          isDimmed ? 'opacity-50' : 'opacity-100'
                        }`}
                        onMouseEnter={() => setHoveredKey(slice.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        onClick={() => onSliceClick(dimension, slice.key)}
                      >
                        <title>
                          {slice.label}: {slice.count} ({slice.percentage.toFixed(1)}%)
                        </title>
                      </path>
                    );
                  })
                )}
              </svg>

              {/* Center Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8 text-center">
                {hoveredSlice ? (
                  <>
                    <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                      {hoveredSlice.count}
                    </span>
                    <span className="text-[11px] font-bold text-red-700 dark:text-red-400 mt-1">
                      {hoveredSlice.percentage.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-tight">
                      {hoveredSlice.label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                      {members.length}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">
                      Total Shown
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {slices.map((slice) => {
                const isHovered = hoveredKey === slice.key;
                const isSelectedFilter = activeFilterValue === slice.key;

                return (
                  <button
                    key={slice.key}
                    type="button"
                    onMouseEnter={() => setHoveredKey(slice.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onClick={() => onSliceClick(dimension, slice.key)}
                    className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
                      isSelectedFilter
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 ring-1 ring-red-500/30'
                        : isHovered
                        ? 'bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700'
                        : 'bg-gray-50/70 dark:bg-zinc-800/40 border-gray-200/70 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {slice.label}
                      </span>
                      {isSelectedFilter && (
                        <Filter className="h-3 w-3 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                        {slice.count}
                      </span>
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 tabular-nums w-11 text-right">
                        {slice.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
