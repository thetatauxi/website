import React from 'react';
import { redirect } from 'next/navigation';
import LoadingLink from '@/components/ui/loading-link';
import { createClient } from '@/lib/supabase/server';
import { getAttendanceInitialData } from './actions';
import ScribeAttendanceGrid from '@/components/attendance/scribe-attendance-grid';
import MemberAttendanceView from '@/components/attendance/member-attendance-view';
import { ArrowLeft, Shield, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Attendance | Theta Tau Xi Chapter',
  description: 'Chapter attendance tracking, QR code check-in, and member points ledger.',
};

export default async function AttendancePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/attendance');
  }

  const data = await getAttendanceInitialData();

  const officerDisplayName = data.profile?.first_name && data.profile.first_name !== 'TEMP'
    ? `${data.profile.first_name} ${data.profile.last_name || ''}`.trim()
    : data.profile?.username || 'Officer';

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb and Officer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <LoadingLink
            href="/members-only"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-400 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Member Portal</span>
          </LoadingLink>

          {data.isOfficer && (
            <>
              {/* Person Logged In (Middle) */}
              <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-3.5 py-1.5 rounded-full shadow-sm self-start sm:self-auto">
                <User className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span>
                  Logged in as: <strong className="font-bold text-gray-900 dark:text-white">{officerDisplayName}</strong>
                  {data.profile?.username && (
                    <span className="text-gray-400 font-normal ml-1">(@{data.profile.username})</span>
                  )}
                </span>
                {data.profile?.role && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 ml-1">
                    {data.profile.role}
                  </span>
                )}
              </div>

              {/* Officer Privileges Active (Right) */}
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-3 py-1 rounded-full self-start sm:self-auto">
                <Shield className="h-3.5 w-3.5" />
                <span>Officer Privileges Active</span>
              </div>
            </>
          )}
        </div>

        {/* View Selection based on Role */}
        {data.isOfficer ? (
          <ScribeAttendanceGrid
            initialMembers={data.members}
            initialEvents={data.events}
            initialRecords={data.attendanceRecords}
            tablesMissing={data.tablesMissing}
          />
        ) : (
          <MemberAttendanceView
            profile={data.profile}
            events={data.events}
            records={data.attendanceRecords}
          />
        )}
      </div>
    </div>
  );
}
