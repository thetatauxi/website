'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMemberStatusFromSheet } from '@/lib/google-sheets';

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  cookies().delete('member_auth');
  redirect('/login');
}

export async function syncMemberStatusAction() {
  const supabase = createClient();
  
  // 1. Verify user is authenticated and is E-Board/Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (!profile) {
    throw new Error('Profile not found');
  }

  const role = profile.role.toLowerCase();
  const allowedRoles = ['regent', 'vice regent', 'corresponding secretary', 'scribe', 'treasurer', 'marshall', 'general chair', 'admin'];
  if (!allowedRoles.includes(role)) {
    throw new Error('Forbidden: Only E-board members can sync roster data.');
  }

  // 2. Fetch member status from Google Sheet
  const sheetRecords = await getMemberStatusFromSheet();
  if (sheetRecords.length === 0) {
    throw new Error('No records found in the Google Sheet or failed to fetch.');
  }

  // 3. Update profiles in Supabase
  let updatedCount = 0;
  const errors: string[] = [];

  for (const record of sheetRecords) {
    const { error: updateError, data } = await supabase
      .from('profiles')
      .update({
        dues_paid: record.duesPaid,
        brotherhood_met: record.brotherhoodMet,
        prof_dev_met: record.profDevMet,
        comm_service_met: record.commServiceMet,
        attendance_points: record.attendancePoints,
        concessions_done: record.concessionsDone,
        updated_at: new Date().toISOString()
      })
      .eq('username', record.username)
      .select();

    if (updateError) {
      console.error(`Failed to update profile for ${record.username}:`, updateError);
      errors.push(`${record.username}: ${updateError.message}`);
    } else if (data && data.length > 0) {
      updatedCount += data.length;
    }
  }

  if (errors.length > 0) {
    throw new Error(`Sync failed for some users: ${errors.join(', ')}`);
  }

  if (updatedCount === 0) {
    throw new Error('No matching profiles found in Supabase database. Make sure the usernames in your Google Sheet match the usernames in your Supabase profiles table.');
  }

  return { success: true, count: updatedCount };
}
