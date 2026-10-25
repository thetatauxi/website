'use client'

import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import LoadingLink from '@/components/ui/loading-link';
import { AttendanceEvent, AttendanceRecord, MemberProfile } from './types';
import ScribeAttendanceGrid from './scribe-attendance-grid';
import MemberAttendanceView from './member-attendance-view';
import { ArrowLeft, Shield, User, UserCheck } from 'lucide-react';

interface AttendanceDashboardClientProps {
  initialMembers: MemberProfile[];
  initialEvents: AttendanceEvent[];
  initialRecords: AttendanceRecord[];
  currentUserProfile: MemberProfile | null;
  isOfficer: boolean;
  tablesMissing?: boolean;
  isPnm?: boolean;
  officerDisplayName: string;
}

export default function AttendanceDashboardClient({
  initialMembers,
  initialEvents,
  initialRecords,
  currentUserProfile,
  isOfficer,
  tablesMissing = false,
  isPnm = false,
  officerDisplayName,
}: AttendanceDashboardClientProps) {
  const searchParams = useSearchParams();

  // State synchronized with attendance grid
  const [dataState, setDataState] = useState({
    members: initialMembers,
    events: initialEvents,
    records: initialRecords,
  });

  const handleDataChange = useCallback(
    (updated: { members: MemberProfile[]; events: AttendanceEvent[]; records: AttendanceRecord[] }) => {
      setDataState(updated);
    },
    []
  );

  // Active view: 'grid' (default for chairs/officers) or 'member' (personal attendance)
  const [currentView, setCurrentView] = useState<'grid' | 'member'>(() => {
    if (!isOfficer) return 'member';
    return searchParams?.get('view') === 'my-attendance' ? 'member' : 'grid';
  });

  const handleViewChange = (newView: 'grid' | 'member') => {
    setCurrentView(newView);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newView === 'member') {
        url.searchParams.set('view', 'my-attendance');
      } else {
        url.searchParams.delete('view');
      }
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Find latest profile data for current user (incorporating live points / medals)
  const currentProfile = useMemo(() => {
    if (!currentUserProfile) return null;
    return dataState.members.find((m) => m.id === currentUserProfile.id) || currentUserProfile;
  }, [currentUserProfile, dataState.members]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb and Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {!isPnm && (
            <LoadingLink
              href="/members-only"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-400 transition-colors self-start sm:self-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Member Portal</span>
            </LoadingLink>
          )}

          {isOfficer && (
            <>
              {/* Person Logged In (Middle) */}
              <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-3.5 py-1.5 rounded-full shadow-sm self-start sm:self-auto">
                <User className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span>
                  Logged in as: <strong className="font-bold text-gray-900 dark:text-white">{officerDisplayName}</strong>
                  {currentUserProfile?.username && (
                    <span className="text-gray-400 font-normal ml-1">(@{currentUserProfile.username})</span>
                  )}
                </span>
                {currentUserProfile?.role && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 ml-1">
                    {currentUserProfile.role}
                  </span>
                )}
              </div>

              {/* Top Right Corner Toggle Button */}
              {currentView === 'grid' ? (
                <button
                  type="button"
                  onClick={() => handleViewChange('member')}
                  title="Switch to personal attendance view"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/60 px-3.5 py-1.5 rounded-full shadow-sm hover:shadow active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>View My Attendance</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleViewChange('grid')}
                  title="Return to chapter attendance grid editor"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 border border-red-600 dark:border-red-500 px-3.5 py-1.5 rounded-full shadow-sm hover:shadow active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5 text-red-100" />
                  <span>Back to Edit</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* View Content */}
        {isOfficer ? (
          <>
            <div className={currentView === 'grid' ? 'block' : 'hidden'}>
              <ScribeAttendanceGrid
                initialMembers={initialMembers}
                initialEvents={initialEvents}
                initialRecords={initialRecords}
                currentUserProfile={currentUserProfile}
                tablesMissing={tablesMissing}
                onDataChange={handleDataChange}
              />
            </div>
            {currentView === 'member' && (
              <MemberAttendanceView
                profile={currentProfile}
                events={dataState.events}
                records={dataState.records}
                onBackToEdit={() => handleViewChange('grid')}
              />
            )}
          </>
        ) : (
          <MemberAttendanceView
            profile={currentUserProfile}
            events={dataState.events}
            records={dataState.records}
          />
        )}
      </div>
    </div>
  );
}
