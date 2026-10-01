'use server'

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AttendanceEvent, AttendanceRecord, MemberProfile, AttendanceStatus } from '@/components/attendance/types';
import { parseAttendancePermissions, AttendancePermissions } from '@/components/attendance/permissions';

/**
 * Helper to check if a user role is authorized to manage chapter attendance or view grid
 */
export async function isUserAuthorizedOfficer(role?: string | null): Promise<boolean> {
  if (!role) return false;
  return parseAttendancePermissions(role).canAccessGrid;
}

/**
 * Fetches authenticated user, profile, and computed permissions
 */
async function getAuthenticatedUserAndPermissions(): Promise<{
  user: { id: string; email?: string };
  profile: MemberProfile | null;
  permissions: AttendancePermissions;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: You must be logged in.');
  }

  const admin = createAdminClient();
  const fullCols = 'id, first_name, last_name, username, role, attendance_points, dues_paid, concessions_done, dues_excused, concessions_excused, status, brotherhood_met, prof_dev_met, comm_service_met';
  const basicCols = 'id, first_name, last_name, username, role, attendance_points, dues_paid, concessions_done, brotherhood_met, prof_dev_met, comm_service_met';

  let profile: MemberProfile | null = null;
  const { data: pData, error: pError } = await admin
    .from('profiles')
    .select(fullCols)
    .eq('id', user.id)
    .single();

  if (!pError && pData) {
    profile = pData as unknown as MemberProfile;
  } else {
    const { data: fallbackP } = await admin
      .from('profiles')
      .select(basicCols)
      .eq('id', user.id)
      .single();
    profile = fallbackP ? ({ ...fallbackP, status: 'ACTIVE', dues_excused: false, concessions_excused: false } as unknown as MemberProfile) : null;
  }

  if (profile && profile.role) {
    const r = profile.role.toLowerCase();
    if (r === 'pnm' || r === 'pledging member' || r.includes('pledg')) {
      profile.concessions_excused = true;
    }
  }

  const permissions = parseAttendancePermissions(profile?.role);
  return { user, profile: profile as MemberProfile | null, permissions };
}

/**
 * Asserts the current user has access to the attendance management grid
 */
async function assertAuthorizedManager() {
  const auth = await getAuthenticatedUserAndPermissions();
  if (!auth.permissions.canAccessGrid) {
    throw new Error('Forbidden: You do not have permission to manage attendance.');
  }
  return auth;
}

interface EventAttendanceWithEvent {
  id: string;
  points_awarded?: number | null;
  status?: string | null;
  attendance_events?: {
    points?: number | null;
    type?: string | null;
  } | null;
}

/**
 * Recalculates and updates the total attendance points and medal completions for a given user
 */
export async function recalculateUserPoints(userId: string): Promise<{
  totalPoints: number;
  brotherhoodMet: boolean;
  profDevMet: boolean;
  commServiceMet: boolean;
}> {
  const admin = createAdminClient();

  // Fetch all present attendance records with event points and type
  const { data: records, error } = await admin
    .from('event_attendance')
    .select(`
      id,
      points_awarded,
      status,
      attendance_events (
        points,
        type
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'present');

  if (error) {
    console.error('Error fetching records for recalculation:', error);
    return { totalPoints: 0, brotherhoodMet: false, profDevMet: false, commServiceMet: false };
  }

  // Calculate sum of points from events
  const typedRecords = (records || []) as unknown as EventAttendanceWithEvent[];
  const totalPoints = typedRecords.reduce((sum, r) => {
    const eventPoints = r.attendance_events?.points;
    const points = typeof eventPoints === 'number' ? eventPoints : (r.points_awarded || 0);
    return sum + points;
  }, 0);

  // Compute pillar requirements based on attended events (matching standard event types)
  const brotherhoodMet = typedRecords.some(r => {
    const t = (r.attendance_events?.type || '').toLowerCase();
    return t === 'brotherhood' || t === 'alumni';
  });
  const profDevMet = typedRecords.some(r => {
    const t = (r.attendance_events?.type || '').toLowerCase();
    return t === 'professional' || t === 'pd' || t.includes('pd');
  });
  const commServiceMet = typedRecords.some(r => {
    const t = (r.attendance_events?.type || '').toLowerCase();
    return t === 'service' || t === 'community service' || t.includes('cleanup');
  });

  // Update profile in Supabase
  await admin
    .from('profiles')
    .update({
      attendance_points: totalPoints,
      brotherhood_met: brotherhoodMet,
      prof_dev_met: profDevMet,
      comm_service_met: commServiceMet,
    })
    .eq('id', userId);

  return { totalPoints, brotherhoodMet, profDevMet, commServiceMet };
}

/**
 * Fetches all initial data required for /attendance
 */
export async function getAttendanceInitialData(): Promise<{
  isOfficer: boolean;
  currentUser: { id: string; email?: string } | null;
  profile: MemberProfile | null;
  members: MemberProfile[];
  events: AttendanceEvent[];
  attendanceRecords: AttendanceRecord[];
  tablesMissing?: boolean;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      isOfficer: false,
      currentUser: null,
      profile: null,
      members: [],
      events: [],
      attendanceRecords: [],
    };
  }

  const admin = createAdminClient();
  const fullCols = 'id, first_name, last_name, username, role, attendance_points, dues_paid, concessions_done, dues_excused, concessions_excused, status, brotherhood_met, prof_dev_met, comm_service_met';
  const basicCols = 'id, first_name, last_name, username, role, attendance_points, dues_paid, concessions_done, brotherhood_met, prof_dev_met, comm_service_met';

  // 1. Fetch current profile safely
  let profile: MemberProfile | null = null;
  const { data: pData, error: pError } = await admin
    .from('profiles')
    .select(fullCols)
    .eq('id', user.id)
    .single();

  if (!pError && pData) {
    profile = pData as unknown as MemberProfile;
  } else {
    const { data: fallbackP } = await admin
      .from('profiles')
      .select(basicCols)
      .eq('id', user.id)
      .single();
    profile = fallbackP ? ({ ...fallbackP, status: 'ACTIVE', dues_excused: false, concessions_excused: false } as unknown as MemberProfile) : null;
  }

  const permissions = parseAttendancePermissions(profile?.role);
  const canAccessGrid = permissions.canAccessGrid;

  // 2. Fetch all events
  const { data: events, error: eventsError } = await admin
    .from('attendance_events')
    .select('*')
    .order('created_at', { ascending: true });

  if (eventsError) {
    console.warn('Attendance tables may not be created yet:', eventsError.message);
    return {
      isOfficer: canAccessGrid,
      currentUser: { id: user.id, email: user.email },
      profile: profile as MemberProfile,
      members: [],
      events: [],
      attendanceRecords: [],
      tablesMissing: true,
    };
  }

  // 3. If officer/chair, fetch all members and all attendance records
  if (canAccessGrid) {
    let membersList: MemberProfile[] = [];
    const { data: mData, error: mError } = await admin
      .from('profiles')
      .select(fullCols)
      .order('first_name', { ascending: true });

    if (!mError && mData) {
      membersList = mData as unknown as MemberProfile[];
    } else {
      const { data: fallbackM } = await admin
        .from('profiles')
        .select(basicCols)
        .order('first_name', { ascending: true });
      membersList = (fallbackM || []).map((m: Record<string, unknown>) => ({
        ...m,
        status: (m.status as MemberProfile['status']) || 'ACTIVE',
        dues_excused: !!m.dues_excused,
        concessions_excused: !!m.concessions_excused,
      })) as unknown as MemberProfile[];
    }

    membersList = membersList.map((m) => {
      const r = (m.role || '').toLowerCase();
      const isPnm = r === 'pnm' || r === 'pledging member' || r.includes('pledg');
      return {
        ...m,
        concessions_excused: isPnm || !!m.concessions_excused,
      };
    });

    const { data: records } = await admin
      .from('event_attendance')
      .select('*');

    return {
      isOfficer: true,
      currentUser: { id: user.id, email: user.email },
      profile: profile as MemberProfile,
      members: membersList,
      events: (events || []) as AttendanceEvent[],
      attendanceRecords: (records || []) as AttendanceRecord[],
    };
  }

  // 4. Regular member: fetch only their own attendance records
  const { data: records } = await admin
    .from('event_attendance')
    .select('*')
    .eq('user_id', user.id);

  return {
    isOfficer: false,
    currentUser: { id: user.id, email: user.email },
    profile: profile as MemberProfile,
    members: profile ? [profile as MemberProfile] : [],
    events: (events || []) as AttendanceEvent[],
    attendanceRecords: (records || []) as AttendanceRecord[],
  };
}

/**
 * Officer / Category Chair Action: Create a new event
 */
export async function createAttendanceEventAction(data: {
  name: string;
  date: string;
  points: number;
  type: string;
  is_active: boolean;
}): Promise<{ success: boolean; event?: AttendanceEvent; error?: string }> {
  try {
    const { permissions } = await assertAuthorizedManager();

    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'Event name is required.' };
    }

    const eventType = data.type || 'general';

    // Verify category permissions
    if (!permissions.isFullOfficer && !permissions.canManageCategory(eventType)) {
      return {
        success: false,
        error: `Forbidden: You only have permission to create '${permissions.allowedCategories.join(', ')}' events.`,
      };
    }

    const admin = createAdminClient();

    // Generate unique slug code for QR scanning
    const slugBase = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 20) || 'event';
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const code = `${slugBase}-${randomSuffix}`;

    const { data: newEvent, error } = await admin
      .from('attendance_events')
      .insert({
        name: data.name.trim(),
        date: data.date.trim() || new Date().toISOString().split('T')[0],
        points: Math.max(0, Math.floor(Number(data.points) || 0)),
        type: eventType,
        is_active: data.is_active ?? true,
        code,
      })
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/attendance');
    revalidatePath('/members-only');
    return { success: true, event: newEvent as AttendanceEvent };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create event.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Officer / Category Chair Action: Update an existing event
 */
export async function updateAttendanceEventAction(
  eventId: string,
  updates: {
    name?: string;
    date?: string;
    points?: number;
    type?: string;
    is_active?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { permissions } = await assertAuthorizedManager();
    const admin = createAdminClient();

    // Check existing event to see if user has permission
    const { data: existingEvent } = await admin
      .from('attendance_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!existingEvent) {
      return { success: false, error: 'Event not found.' };
    }

    if (!permissions.isFullOfficer && !permissions.canManageCategory(existingEvent.type)) {
      return {
        success: false,
        error: `Forbidden: You only have permission to manage '${permissions.allowedCategories.join(', ')}' events.`,
      };
    }

    if (
      updates.type &&
      updates.type !== existingEvent.type &&
      !permissions.isFullOfficer &&
      !permissions.canManageCategory(updates.type)
    ) {
      return {
        success: false,
        error: `Forbidden: You cannot change event type to '${updates.type}'.`,
      };
    }

    const payload: {
      updated_at: string;
      name?: string;
      date?: string;
      points?: number;
      type?: string;
      is_active?: boolean;
    } = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.date !== undefined) payload.date = updates.date.trim();
    if (updates.points !== undefined) payload.points = Math.max(0, Math.floor(Number(updates.points)));
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.is_active !== undefined) payload.is_active = updates.is_active;

    const { error } = await admin
      .from('attendance_events')
      .update(payload)
      .eq('id', eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    // If point value or type changed, update points_awarded and recalculate for all attendees
    const pointsChanged = updates.points !== undefined && existingEvent.points !== payload.points;
    const typeChanged = updates.type !== undefined && existingEvent.type !== payload.type;

    if (pointsChanged || typeChanged) {
      if (pointsChanged) {
        await admin
          .from('event_attendance')
          .update({ points_awarded: payload.points })
          .eq('event_id', eventId);
      }

      // Find all attendees and recalculate their profile points & medals
      const { data: attendees } = await admin
        .from('event_attendance')
        .select('user_id')
        .eq('event_id', eventId);

      if (attendees && attendees.length > 0) {
        for (const att of attendees) {
          await recalculateUserPoints(att.user_id);
        }
      }
    }

    revalidatePath('/attendance');
    revalidatePath('/members-only');
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update event.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Officer / Category Chair Action: Delete an event
 */
export async function deleteAttendanceEventAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { permissions } = await assertAuthorizedManager();
    const admin = createAdminClient();

    const { data: existingEvent } = await admin
      .from('attendance_events')
      .select('type')
      .eq('id', eventId)
      .single();

    if (!existingEvent) {
      return { success: false, error: 'Event not found.' };
    }

    if (!permissions.isFullOfficer && !permissions.canManageCategory(existingEvent.type)) {
      return {
        success: false,
        error: `Forbidden: You only have permission to delete '${permissions.allowedCategories.join(', ')}' events.`,
      };
    }

    // Find affected members to update points and medals after deletion
    const { data: attendees } = await admin
      .from('event_attendance')
      .select('user_id')
      .eq('event_id', eventId);

    const { error } = await admin
      .from('attendance_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Recalculate points and status for members
    if (attendees && attendees.length > 0) {
      for (const att of attendees) {
        await recalculateUserPoints(att.user_id);
      }
    }

    revalidatePath('/attendance');
    revalidatePath('/members-only');
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete event.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Officer / Category Chair Action: Set attendance status for a member (PRESENT, EXCUSED, UNEXCUSED, EMPTY)
 */
export async function setAttendanceStatusAction(
  eventId: string,
  userId: string,
  newStatus: AttendanceStatus
): Promise<{
  success: boolean;
  newPoints?: number;
  brotherhoodMet?: boolean;
  profDevMet?: boolean;
  commServiceMet?: boolean;
  error?: string;
}> {
  try {
    const { permissions, profile } = await assertAuthorizedManager();
    const admin = createAdminClient();

    // Fetch event points and type
    const { data: event } = await admin
      .from('attendance_events')
      .select('points, type')
      .eq('id', eventId)
      .single();

    if (!event) {
      return { success: false, error: 'Event not found.' };
    }

    if (!permissions.isFullOfficer && !permissions.canManageCategory(event.type)) {
      return {
        success: false,
        error: `Forbidden: You only have permission to check off '${permissions.allowedCategories.join(', ')}' events.`,
      };
    }

    const eventPoints = event?.points || 0;

    if (newStatus === 'empty') {
      // Remove attendance record
      const { error: deleteError } = await admin
        .from('event_attendance')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
    } else {
      // Upsert attendance record with new status
      const awarded = newStatus === 'present' ? eventPoints : 0;
      const { error: upsertError } = await admin
        .from('event_attendance')
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            status: newStatus,
            points_awarded: awarded,
            verified_by: profile?.username || 'chair',
          },
          { onConflict: 'event_id,user_id' }
        );

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
    }

    // Recalculate user points and pillar medals
    const recalc = await recalculateUserPoints(userId);

    revalidatePath('/attendance');
    revalidatePath('/members-only');
    return {
      success: true,
      newPoints: recalc.totalPoints,
      brotherhoodMet: recalc.brotherhoodMet,
      profDevMet: recalc.profDevMet,
      commServiceMet: recalc.commServiceMet,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update attendance status.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Backwards compatibility wrapper for boolean toggle
 */
export async function toggleAttendanceRecordAction(
  eventId: string,
  userId: string,
  isAttended: boolean
): Promise<{
  success: boolean;
  newPoints?: number;
  brotherhoodMet?: boolean;
  profDevMet?: boolean;
  commServiceMet?: boolean;
  error?: string;
}> {
  return setAttendanceStatusAction(eventId, userId, isAttended ? 'present' : 'empty');
}

/**
 * Officer Action: Update Member Status (ACTIVE, CO-OP, etc.) and Excuse Flags
 */
export async function updateMemberStatusAndExcusesAction(data: {
  userId: string;
  status: string;
  duesExcused?: boolean;
  concessionsExcused?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { permissions } = await getAuthenticatedUserAndPermissions();
    if (!permissions.canAccessGrid) {
      return { success: false, error: 'Forbidden: Insufficient privileges.' };
    }

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (permissions.isFullOfficer) {
      updates.status = data.status || 'ACTIVE';
      updates.dues_excused = !!data.duesExcused;
      updates.concessions_excused = !!data.concessionsExcused;
    } else {
      if (permissions.canEditDues) {
        updates.dues_excused = !!data.duesExcused;
      }
      if (permissions.canEditConcessions) {
        updates.concessions_excused = !!data.concessionsExcused;
      }
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: 'No authorized fields to update.' };
    }

    const { error } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', data.userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/attendance');
    revalidatePath('/members-only');
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update member status.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Treasurer / Officer Action: Toggle Dues paid status
 */
export async function toggleDuesAction(
  userId: string,
  duesPaid: boolean
): Promise<{ success: boolean; duesPaid?: boolean; error?: string }> {
  try {
    const { permissions } = await getAuthenticatedUserAndPermissions();

    if (!permissions.canEditDues) {
      return {
        success: false,
        error: 'Forbidden: Only the Treasurer or Executive Officers can edit Dues.',
      };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({ dues_paid: duesPaid })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/attendance');
    revalidatePath('/members-only');
    return { success: true, duesPaid };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update dues.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Fundraising Chair / Officer Action: Toggle Concessions completed status
 */
export async function toggleConcessionsAction(
  userId: string,
  concessionsDone: boolean
): Promise<{ success: boolean; concessionsDone?: boolean; error?: string }> {
  try {
    const { permissions } = await getAuthenticatedUserAndPermissions();

    if (!permissions.canEditConcessions) {
      return {
        success: false,
        error: 'Forbidden: Only the Fundraising Chair or Executive Officers can edit Consessions.',
      };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({ concessions_done: concessionsDone })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/attendance');
    revalidatePath('/members-only');
    return { success: true, concessionsDone };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update consessions.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Member / QR Scan Action: Check in via QR code slug
 */
export async function checkInWithQrCodeAction(code: string): Promise<{
  success: boolean;
  status: 'success' | 'inactive' | 'already_checked_in' | 'not_found' | 'unauthenticated' | 'error';
  eventName?: string;
  points?: number;
  scannedAt?: string;
  newTotalPoints?: number;
  message?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        status: 'unauthenticated',
        message: 'Please log in to your Theta Tau member account to confirm your attendance.',
      };
    }

    const admin = createAdminClient();

    // 1. Locate the event by code
    const { data: event, error: eventError } = await admin
      .from('attendance_events')
      .select('*')
      .eq('code', code)
      .single();

    if (eventError || !event) {
      return {
        success: false,
        status: 'not_found',
        message: 'This attendance event does not exist or the QR code is invalid.',
      };
    }

    // 2. Validate active status
    if (!event.is_active) {
      return {
        success: false,
        status: 'inactive',
        eventName: event.name,
        points: event.points,
        message: 'Check-in is currently closed for this event. Please ask the event organizer to activate it.',
      };
    }

    // 3. Check if already checked in
    const { data: existing } = await admin
      .from('event_attendance')
      .select('*')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return {
        success: true,
        status: 'already_checked_in',
        eventName: event.name,
        points: event.points,
        scannedAt: existing.scanned_at,
        message: `You are already checked in for ${event.name}.`,
      };
    }

    // 4. Record attendance
    const nowIso = new Date().toISOString();
    const { error: insertError } = await admin
      .from('event_attendance')
      .insert({
        event_id: event.id,
        user_id: user.id,
        status: 'present',
        points_awarded: event.points,
        verified_by: 'qr_scan',
        scanned_at: nowIso,
      });

    if (insertError) {
      return {
        success: false,
        status: 'error',
        message: insertError.message || 'Failed to record attendance.',
      };
    }

    // 5. Update user's points and status medals
    const recalc = await recalculateUserPoints(user.id);

    revalidatePath('/attendance');
    revalidatePath('/members-only');

    return {
      success: true,
      status: 'success',
      eventName: event.name,
      points: event.points,
      scannedAt: nowIso,
      newTotalPoints: recalc.totalPoints,
      message: event.points > 0
        ? `Checked into ${event.name}! +${event.points} attendance point${event.points > 1 ? 's' : ''} added to your profile.`
        : `Checked into ${event.name}!`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred during check-in.';
    return {
      success: false,
      status: 'error',
      message: errorMsg,
    };
  }
}

/**
 * Chapter Admin Action: Sync all members' points and medals from existing attendance records
 */
export async function syncAllMembersAttendanceStatusAction(): Promise<{
  success: boolean;
  updatedCount: number;
  error?: string;
}> {
  try {
    const { permissions } = await assertAuthorizedManager();
    if (!permissions.isFullOfficer) {
      return { success: false, updatedCount: 0, error: 'Forbidden: Only executive officers can run chapter sync.' };
    }

    const admin = createAdminClient();
    const { data: profiles } = await admin.from('profiles').select('id');
    let count = 0;
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        await recalculateUserPoints(p.id);
        count++;
      }
    }

    revalidatePath('/attendance');
    revalidatePath('/members-only');
    return { success: true, updatedCount: count };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to sync members.';
    return { success: false, updatedCount: 0, error: errorMsg };
  }
}
