'use client'

import React from 'react';
import { Loader2 } from 'lucide-react';
import { AttendanceStatus } from './types';

interface AttendanceStatusCellProps {
  status: AttendanceStatus;
  isPending?: boolean;
  disabled?: boolean;
  onSelect: (newStatus: AttendanceStatus) => void;
  title?: string;
}

export default function AttendanceStatusCell({
  status,
  isPending = false,
  disabled = false,
  onSelect,
  title,
}: AttendanceStatusCellProps) {
  const isPresent = status === 'present';
  const isExcused = status === 'excused';
  const isUnexcused = status === 'unexcused';
  const isEmpty = !status || status === 'empty';

  const handlePClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isPending) return;
    onSelect(isPresent ? 'empty' : 'present');
  };

  const handleEClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isPending) return;
    onSelect(isExcused ? 'empty' : 'excused');
  };

  const handleUClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isPending) return;
    onSelect(isUnexcused ? 'empty' : 'unexcused');
  };

  return (
    <div
      title={title}
      className={`group/cell relative w-full h-full min-h-[50px] flex flex-col justify-between overflow-hidden select-none transition-colors ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
    >
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/75 dark:bg-zinc-900/75 z-20 backdrop-blur-[1px]">
          <Loader2 className="h-4 w-4 animate-spin text-gray-700 dark:text-gray-300" />
        </div>
      )}

      {/* Top Half: "P" (Present - Green) */}
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={handlePClick}
        title={isPresent ? 'Present (Click to clear)' : 'Mark Present (P)'}
        className={`w-full flex-1 min-h-[25px] flex items-center justify-center transition-all ${
          isPresent
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm tracking-wider shadow-inner'
            : `text-emerald-700 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 active:bg-emerald-500/30 ${
                isEmpty ? 'opacity-0 group-hover/cell:opacity-100 group-focus-within/cell:opacity-100' : 'opacity-0 group-hover/cell:opacity-80'
              }`
        }`}
      >
        P
      </button>

      {/* Horizontal Divider between Top and Bottom */}
      <div
        className={`w-full h-[1px] bg-gray-200 dark:bg-zinc-800 transition-opacity ${
          isEmpty ? 'opacity-0 group-hover/cell:opacity-100' : 'opacity-100'
        }`}
      />

      {/* Bottom Half: Split "E" (Yellow) & "U" (Red) */}
      <div className="w-full flex-1 min-h-[25px] flex items-stretch">
        {/* Left: "E" (Excused - Yellow/Amber) */}
        <button
          type="button"
          disabled={disabled || isPending}
          onClick={handleEClick}
          title={isExcused ? 'Excused (Click to clear)' : 'Mark Excused (E)'}
          className={`w-1/2 h-full flex items-center justify-center border-r border-gray-200 dark:border-zinc-800 transition-all ${
            isExcused
              ? 'bg-amber-500 hover:bg-amber-600 text-white font-black text-xs tracking-wider shadow-inner'
              : `text-amber-700 dark:text-amber-400 font-bold text-[11px] hover:bg-amber-500/20 active:bg-amber-500/30 ${
                  isEmpty ? 'opacity-0 group-hover/cell:opacity-100 group-focus-within/cell:opacity-100' : 'opacity-0 group-hover/cell:opacity-80'
                }`
          }`}
        >
          E
        </button>

        {/* Right: "U" (Unexcused - Red) */}
        <button
          type="button"
          disabled={disabled || isPending}
          onClick={handleUClick}
          title={isUnexcused ? 'Unexcused (Click to clear)' : 'Mark Unexcused (U)'}
          className={`w-1/2 h-full flex items-center justify-center transition-all ${
            isUnexcused
              ? 'bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-wider shadow-inner'
              : `text-red-700 dark:text-red-400 font-bold text-[11px] hover:bg-red-500/20 active:bg-red-500/30 ${
                  isEmpty ? 'opacity-0 group-hover/cell:opacity-100 group-focus-within/cell:opacity-100' : 'opacity-0 group-hover/cell:opacity-80'
                }`
          }`}
        >
          U
        </button>
      </div>
    </div>
  );
}
