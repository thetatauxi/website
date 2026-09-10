'use client'

import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { AttendanceEvent, AttendanceRecord, MemberProfile } from './types';
import { Button } from '@/components/ui/button';
import { updateAttendanceEventAction } from '@/app/attendance/actions';
import { X, CheckCircle2, QrCode, Radio, Users, Award, Calendar, AlertCircle } from 'lucide-react';

interface FullScreenQrViewProps {
  event: AttendanceEvent;
  attendanceRecords: AttendanceRecord[];
  members: MemberProfile[];
  onClose: () => void;
  onEventStatusChange: (updatedEvent: AttendanceEvent) => void;
}

export default function FullScreenQrView({
  event,
  attendanceRecords,
  members,
  onClose,
  onEventStatusChange,
}: FullScreenQrViewProps) {
  const [isActive, setIsActive] = useState(event.is_active ?? true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Compute checked in members for this event
  const checkedInUserIds = new Set(
    attendanceRecords
      .filter((r) => r.event_id === event.id && r.status === 'present')
      .map((r) => r.user_id)
  );

  const checkedInMembers = members.filter((m) => checkedInUserIds.has(m.id));

  // Build full check-in URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const checkInUrl = `${origin}/attendance/scan/${event.code}`;

  const toggleEventActive = async () => {
    const newActiveState = !isActive;
    setIsActive(newActiveState);
    setIsUpdating(true);
    try {
      await updateAttendanceEventAction(event.id, { is_active: newActiveState });
      onEventStatusChange({ ...event, is_active: newActiveState });
    } catch (err) {
      console.error('Failed to toggle event status:', err);
      setIsActive(!newActiveState); // revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col h-screen max-h-screen overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="h-16 px-6 sm:px-10 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-700/20 border border-red-600/30 flex items-center justify-center text-red-500">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold tracking-wider text-sm sm:text-base text-zinc-100 uppercase">
              Theta Tau <span className="text-red-500">Xi</span> Attendance
            </div>
            <div className="text-[11px] text-zinc-400">
              Live Check-In Kiosk
            </div>
          </div>
        </div>

        {/* Status Pill & Top Exit Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleEventActive}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all ${
              isActive
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/50'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-750'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
            {isActive ? 'CHECK-IN OPEN' : 'CHECK-IN PAUSED'}
            <span className="text-[10px] text-zinc-400 underline ml-1 hidden sm:inline">
              (Toggle)
            </span>
          </button>

          <Button
            onClick={onClose}
            size="sm"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs px-3.5 h-8 flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Exit Full Screen (Esc)"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit Full Screen</span>
          </Button>
        </div>
      </header>

      {/* Main Kiosk Content (Non-scrollable Screen) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-4 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center overflow-hidden">
        {/* Left Column: Very Large QR Code */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center text-center">
          <div className="relative group">
            {/* Outer Glow */}
            <div className={`absolute -inset-2 rounded-3xl blur-xl opacity-30 transition-all ${
              isActive ? 'bg-red-600 group-hover:opacity-40' : 'bg-zinc-600'
            }`} />

            {/* QR Code Container */}
            <div className="relative p-5 sm:p-7 bg-white rounded-3xl shadow-2xl border-4 border-zinc-800 flex flex-col items-center justify-center">
              <QRCode
                value={checkInUrl}
                size={290}
                style={{ height: 'auto', maxHeight: '48vh', maxWidth: '100%', width: '100%' }}
                viewBox="0 0 256 256"
              />
              {!isActive && (
                <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-center p-6">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                  <div className="text-lg font-bold text-white">Check-in Paused</div>
                  <p className="text-xs text-zinc-400 max-w-xs mt-1">
                    The Scribe has temporarily closed scans for this event.
                  </p>
                  <Button
                    onClick={toggleEventActive}
                    size="sm"
                    className="mt-4 bg-red-700 hover:bg-red-800 text-white text-xs"
                  >
                    Re-activate Scans
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-300">
              <Radio className={`h-4 w-4 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
              Scan with your phone camera to check in
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5 max-w-md truncate">
              {checkInUrl}
            </p>
          </div>
        </div>

        {/* Right Column: Event Details & Live Scanned Members */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800/60">
              {event.type.toUpperCase()}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-yellow-500" />
              {event.points === 0 ? '0 Points (Rush)' : `${event.points} Attendance Point${event.points > 1 ? 's' : ''}`}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {event.date}
            </span>
          </div>

          {/* Event Title */}
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {event.name}
          </h1>

          {/* Scanned In Metric Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Active Members Scanned In
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                {checkedInMembers.length} <span className="text-xs font-semibold text-zinc-400">/ {members.length}</span>
              </span>
            </div>

            {/* List of checked in members (scrollable inner box only) */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {checkedInMembers.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs italic">
                  Waiting for members to scan the QR code...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {checkedInMembers.map((member) => {
                    const fullName = member.first_name && member.first_name !== 'TEMP'
                      ? `${member.first_name} ${member.last_name || ''}`
                      : member.username;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/70 border border-zinc-700/50 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-200"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate font-medium">{fullName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
