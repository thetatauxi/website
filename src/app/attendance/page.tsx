import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAttendanceInitialData } from './actions';
import AttendanceDashboardClient from '@/components/attendance/attendance-dashboard-client';

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
  const roleLower = (data.profile?.role || '').toLowerCase();
  const isPnm = roleLower === 'pnm' || roleLower === 'pledging member' || roleLower.includes('pledg');

  const officerDisplayName = data.profile?.first_name && data.profile.first_name !== 'TEMP'
    ? `${data.profile.first_name} ${data.profile.last_name || ''}`.trim()
    : data.profile?.username || 'Officer';

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8" />}>
      <AttendanceDashboardClient
        initialMembers={data.members}
        initialEvents={data.events}
        initialRecords={data.attendanceRecords}
        currentUserProfile={data.profile}
        isOfficer={data.isOfficer}
        tablesMissing={data.tablesMissing}
        isPnm={isPnm}
        officerDisplayName={officerDisplayName}
      />
    </Suspense>
  );
}
