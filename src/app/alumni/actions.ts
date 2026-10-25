'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface AlumniRecord {
  id: string;                                   // 'alum_{userID}'
  first_name: string;                           // Required
  last_name: string;                            // Required
  status: string;                               // Required: 'ALUMNI', etc.
  email?: string | null;
  linkedin?: string | null;
  grad_year?: number | null;
  pledge_sem?: string | null;
  address?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Checks if the caller has officer / E-board permissions
 */
async function verifyOfficerPermission() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: Please log in.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile?.role || '').toLowerCase();
  const allowedRoles = [
    'regent', 'vice regent', 'corresponding secretary', 'scribe',
    'treasurer', 'marshal', 'general chair', 'admin', 'website chair', 'web chair', 'website'
  ];

  if (!allowedRoles.includes(role)) {
    throw new Error('Forbidden: Insufficient officer permissions.');
  }

  return { user, profile };
}

/**
 * Fetch all alumni records
 */
export async function getAlumniListAction(): Promise<{ alumni: AlumniRecord[]; error?: string }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('alumni')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) {
      return { alumni: [], error: error.message };
    }

    return { alumni: (data || []) as AlumniRecord[] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch alumni';
    return { alumni: [], error: msg };
  }
}

/**
 * Create a new alumni record manually
 */
export async function createAlumniAction(data: {
  id?: string;
  first_name: string;
  last_name: string;
  status: string;
  email?: string;
  linkedin?: string;
  grad_year?: number;
  pledge_sem?: string;
  address?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await verifyOfficerPermission();

    if (!data.first_name || !data.first_name.trim()) {
      return { success: false, error: 'First name is required.' };
    }
    if (!data.last_name || !data.last_name.trim()) {
      return { success: false, error: 'Last name is required.' };
    }
    if (!data.status || !data.status.trim()) {
      return { success: false, error: 'Status is required.' };
    }

    const admin = createAdminClient();
    const cleanId = data.id && data.id.startsWith('alum_')
      ? data.id
      : `alum_${(data.id || `${data.first_name.toLowerCase()}_${data.last_name.toLowerCase()}_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '')}`;

    const { error } = await admin
      .from('alumni')
      .insert({
        id: cleanId,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        status: data.status.trim().toUpperCase(),
        email: data.email?.trim() || null,
        linkedin: data.linkedin?.trim() || null,
        grad_year: data.grad_year ? Number(data.grad_year) : null,
        pledge_sem: data.pledge_sem?.trim() || null,
        address: data.address?.trim() || null,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/alumni');
    revalidatePath('/family-tree');
    return { success: true, id: cleanId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create alumni';
    return { success: false, error: msg };
  }
}

/**
 * Updates an existing alumni record
 */
export async function updateAlumniAction(
  id: string,
  data: Partial<Omit<AlumniRecord, 'id' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyOfficerPermission();

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.first_name !== undefined) {
      if (!data.first_name.trim()) return { success: false, error: 'First name cannot be empty.' };
      updates.first_name = data.first_name.trim();
    }
    if (data.last_name !== undefined) {
      if (!data.last_name.trim()) return { success: false, error: 'Last name cannot be empty.' };
      updates.last_name = data.last_name.trim();
    }
    if (data.status !== undefined) {
      if (!data.status.trim()) return { success: false, error: 'Status cannot be empty.' };
      updates.status = data.status.trim().toUpperCase();
    }
    if (data.email !== undefined) updates.email = data.email?.trim() || null;
    if (data.linkedin !== undefined) updates.linkedin = data.linkedin?.trim() || null;
    if (data.grad_year !== undefined) updates.grad_year = data.grad_year ? Number(data.grad_year) : null;
    if (data.pledge_sem !== undefined) updates.pledge_sem = data.pledge_sem?.trim() || null;
    if (data.address !== undefined) updates.address = data.address?.trim() || null;

    const { error } = await admin
      .from('alumni')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/alumni');
    revalidatePath('/family-tree');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update alumni';
    return { success: false, error: msg };
  }
}

/**
 * Deletes an alumni record
 */
export async function deleteAlumniAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyOfficerPermission();

    const admin = createAdminClient();
    const { error } = await admin
      .from('alumni')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/alumni');
    revalidatePath('/family-tree');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete alumni';
    return { success: false, error: msg };
  }
}

/**
 * Member Transition Lifecycle:
 * 1. Exports current active member's full profile and historical attendance to a CSV string.
 * 2. Inserts their data into public.alumni with id = 'alum_{userID}'.
 * 3. Updates any family tree node referencing user_id to point to alum_id = 'alum_{userID}'.
 * 4. Hard deletes from public.profiles and deletes their Supabase auth user so they no longer access the main site.
 * 5. Returns the CSV content so the client can trigger an immediate browser file download.
 */
export async function transitionMemberToAlumniAction(params: {
  userId: string;
  status?: string;
  email?: string;
  linkedin?: string;
  grad_year?: number;
  pledge_sem?: string;
  address?: string;
}): Promise<{
  success: boolean;
  csvContent?: string;
  fileName?: string;
  alumniId?: string;
  error?: string;
}> {
  try {
    await verifyOfficerPermission();

    const admin = createAdminClient();
    const { userId } = params;

    // 1. Fetch active member profile
    const { data: profile, error: pError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (pError || !profile) {
      return { success: false, error: `Member profile not found for ID: ${userId}` };
    }

    // 2. Fetch auth user to get registered email
    let authEmail = '';
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      if (authUser?.user?.email) {
        authEmail = authUser.user.email;
      }
    } catch {
      // Ignore if auth user lookup fails
    }

    // 3. Fetch all attendance history for this member
    const { data: attendanceHistory } = await admin
      .from('event_attendance')
      .select(`
        id,
        status,
        points_awarded,
        scanned_at,
        attendance_events (
          name,
          date,
          type,
          points
        )
      `)
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false });

    // 4. Generate comprehensive CSV backup string
    const firstName = profile.first_name || 'Brother';
    const lastName = profile.last_name || '';
    const username = profile.username || 'unknown';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `theta_tau_backup_${username}_${timestamp}.csv`;

    const csvLines: string[] = [];
    csvLines.push('--- THETA TAU XI CHAPTER: MEMBER ARCHIVE & BACKUP ---');
    csvLines.push(`Exported At,"${new Date().toISOString()}"`);
    csvLines.push(`User ID,"${userId}"`);
    csvLines.push(`Username,"${username}"`);
    csvLines.push(`First Name,"${firstName}"`);
    csvLines.push(`Last Name,"${lastName}"`);
    csvLines.push(`Auth Email,"${authEmail}"`);
    csvLines.push(`Role,"${profile.role || 'Member'}"`);
    csvLines.push(`Previous Status,"${profile.status || 'ACTIVE'}"`);
    csvLines.push(`Graduation Year,"${profile.graduation_year || params.grad_year || ''}"`);
    csvLines.push(`Pledge Class,"${profile.pledge_class || params.pledge_sem || ''}"`);
    csvLines.push(`Total Attendance Points,"${profile.attendance_points || 0}"`);
    csvLines.push(`Dues Paid,"${profile.dues_paid ? 'YES' : 'NO'}"`);
    csvLines.push(`Concessions Completed,"${profile.concessions_done ? 'YES' : 'NO'}"`);
    csvLines.push('');
    csvLines.push('--- HISTORICAL EVENT ATTENDANCE LOG ---');
    csvLines.push('Event Name,Event Date,Event Type,Event Points,Member Status,Points Awarded,Scanned At');

    if (attendanceHistory && attendanceHistory.length > 0) {
      for (const rec of attendanceHistory) {
        const ev = rec.attendance_events as { name?: string; date?: string; type?: string; points?: number } | null;
        const evName = (ev?.name || 'Unknown Event').replace(/"/g, '""');
        const evDate = (ev?.date || '').replace(/"/g, '""');
        const evType = (ev?.type || '').replace(/"/g, '""');
        const evPoints = ev?.points ?? '';
        const recStatus = (rec.status || '').replace(/"/g, '""');
        const ptsAwarded = rec.points_awarded ?? '';
        const scannedAt = (rec.scanned_at || '').replace(/"/g, '""');

        csvLines.push(`"${evName}","${evDate}","${evType}",${evPoints},"${recStatus}",${ptsAwarded},"${scannedAt}"`);
      }
    } else {
      csvLines.push('No event attendance records found for this member.');
    }

    const csvContent = csvLines.join('\n');

    // 5. Insert/Upsert into public.alumni with id = 'alum_{userID}'
    const alumniId = `alum_${userId}`;
    const targetStatus = (params.status || 'ALUMNI').trim().toUpperCase();

    const { error: alumniInsertError } = await admin
      .from('alumni')
      .upsert({
        id: alumniId,
        first_name: firstName,
        last_name: lastName,
        status: targetStatus,
        email: params.email?.trim() || authEmail || null,
        linkedin: params.linkedin?.trim() || null,
        grad_year: params.grad_year ? Number(params.grad_year) : (profile.graduation_year || null),
        pledge_sem: params.pledge_sem?.trim() || profile.pledge_class || null,
        address: params.address?.trim() || null,
        user_id: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (alumniInsertError) {
      return { success: false, error: `Failed to insert alumni record: ${alumniInsertError.message}` };
    }

    // 6. Update Family Tree nodes to point to alumni record
    try {
      await admin
        .from('family_tree_nodes')
        .update({
          is_alumni: true,
          alum_id: alumniId,
          user_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch {
      // Family tree update is best-effort if table or rows not yet present
    }

    // 7. Hard delete active member from public.profiles
    const { error: deleteProfileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      return {
        success: false,
        error: `Alumni record created, but failed to delete from active profiles: ${deleteProfileError.message}`,
        csvContent,
        fileName,
        alumniId,
      };
    }

    // 8. Delete user from auth.users so they no longer access the main site
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch (authDelErr) {
      console.warn('Note: Auth account deletion warning:', authDelErr);
    }

    revalidatePath('/attendance');
    revalidatePath('/members-only');
    revalidatePath('/alumni');
    revalidatePath('/family-tree');

    return {
      success: true,
      csvContent,
      fileName,
      alumniId,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to transition member to alumni';
    return { success: false, error: msg };
  }
}
