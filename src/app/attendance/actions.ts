'use server'

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AttendanceEvent, AttendanceRecord, MemberProfile } from '@/components/attendance/types';

const PRIVILEGED_ATTENDANCE_ROLES = [
  'regent',
  'vice regent',
  'scribe',
  'website chair',
  'web chair',
  'website',
  'admin'
];

/**
 * Helper to check if a user role is authorized to manage chapter attendance
 */
export async function isUserAuthorizedOfficer(role?: string | null): Promise<boolean> {
  if (!role) return false;
  return PRIVILEGED_ATTENDANCE_ROLES.includes(role.trim().toLowerCase());
}

/**
 * Asserts the current user is an authorized officer
 */
async function assertOfficer() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: You must be logged in.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single();

  const isOfficer = await isUserAuthorizedOfficer(profile?.role);
  if (!isOfficer) {
    throw new Error('Forbidden: Only the Scribe, Regent, Vice Regent, or Website Chair can edit attendance.');
  }

  return { user, profile };
}

interface EventAttendanceWithEvent {
  id: string;
  points_awarded?: number | null;
  status?: string | null;
  attendance_events?: {
    points?: number | null;
  } | null;
}

/**
 * Recalculates and updates the total attendance points for a given user
 */
export async function recalculateUserPoints(userId: string): Promise<number> {
  const admin = createAdminClient();

  // Fetch all present attendance records with event points
  const { data: records, error } = await admin
    .from('event_attendance')
    .select(`
      id,
      points_awarded,
      status,
      attendance_events (
        points
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'present');

  if (error) {
    console.error('Error fetching records for recalculation:', error);
    return 0;
  }

  // Calculate sum of points from events
  const typedRecords = (records || []) as unknown as EventAttendanceWithEvent[];
  const totalPoints = typedRecords.reduce((sum, r) => {
    const eventPoints = r.attendance_events?.points;
    const points = typeof eventPoints === 'number' ? eventPoints : (r.points_awarded || 0);
    return sum + points;
  }, 0);

  // Update profile
  await admin
    .from('profiles')
    .update({ attendance_points: totalPoints })
    .eq('id', userId);

  return totalPoints;
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

  // 1. Fetch current profile
  const { data: profile } = await admin
    .from('profiles')
    .select('id, first_name, last_name, username, role, attendance_points')
    .eq('id', user.id)
    .single();

  const isOfficer = await isUserAuthorizedOfficer(profile?.role);

  // 2. Fetch all events
  const { data: events, error: eventsError } = await admin
    .from('attendance_events')
    .select('*')
    .order('created_at', { ascending: true });

  if (eventsError) {
    console.warn('Attendance tables may not be created yet:', eventsError.message);
    return {
      isOfficer,
      currentUser: { id: user.id, email: user.email },
      profile: profile as MemberProfile,
      members: [],
      events: [],
      attendanceRecords: [],
      tablesMissing: true,
    };
  }

  // 3. If officer, fetch all active members and all attendance records
  if (isOfficer) {
    const { data: members } = await admin
      .from('profiles')
      .select('id, first_name, last_name, username, role, attendance_points')
      .order('first_name', { ascending: true });

    const { data: records } = await admin
      .from('event_attendance')
      .select('*');

    return {
      isOfficer: true,
      currentUser: { id: user.id, email: user.email },
      profile: profile as MemberProfile,
      members: (members || []) as MemberProfile[],
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
 * Officer Action: Create a new event
 */
export async function createAttendanceEventAction(data: {
  name: string;
  date: string;
  points: number;
  type: string;
  is_active: boolean;
}): Promise<{ success: boolean; event?: AttendanceEvent; error?: string }> {
  try {
    await assertOfficer();

    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'Event name is required.' };
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
        type: data.type || 'general',
        is_active: data.is_active ?? true,
        code,
      })
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/attendance');
    return { success: true, event: newEvent as AttendanceEvent };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create event.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Officer Action: Update an existing event
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
    await assertOfficer();

    const admin = createAdminClient();

    // Check existing event to see if points changed
    const { data: existingEvent } = await admin
      .from('attendance_events')
      .select('points')
      .eq('id', eventId)
      .single();

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

    // If point value changed, update points_awarded and recalculate for all attendees
    if (updates.points !== undefined && existingEvent && existingEvent.points !== payload.points) {
      // Update records
      await admin
        .from('event_attendance')
        .update({ points_awarded: payload.points })
        .eq('event_id', eventId);

      // Find all attendees
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
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update event.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Officer Action: Delete an event
 */
export async function deleteAttendanceEventAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertOfficer();

    const admin = createAdminClient();

    // Find affected members to update points after deletion
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

    // Recalculate points for members
    if (attendees && attendees.length > 0) {
      for (const att of attendees) {
        await recalculateUserPoints(att.user_id);
      }
    }

    revalidatePath('/attendance');
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete event.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Officer Action: Toggle attendance checkbox for a member
 */
export async function toggleAttendanceRecordAction(
  eventId: string,
  userId: string,
  isAttended: boolean
): Promise<{ success: boolean; newPoints?: number; error?: string }> {
  try {
    const { profile } = await assertOfficer();
    const admin = createAdminClient();

    // Fetch event points
    const { data: event } = await admin
      .from('attendance_events')
      .select('points')
      .eq('id', eventId)
      .single();

    const eventPoints = event?.points || 0;

    if (isAttended) {
      // Upsert attendance record
      const { error: insertError } = await admin
        .from('event_attendance')
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            status: 'present',
            points_awarded: eventPoints,
            verified_by: profile?.username || 'officer',
          },
          { onConflict: 'event_id,user_id' }
        );

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    } else {
      // Remove attendance record
      const { error: deleteError } = await admin
        .from('event_attendance')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
    }

    // Recalculate user points
    const newPoints = await recalculateUserPoints(userId);

    revalidatePath('/attendance');
    return { success: true, newPoints };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to toggle attendance.';
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
        message: 'Check-in is currently closed for this event. Please ask the Scribe to activate it.',
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

    // 5. Update user's points
    const newTotalPoints = await recalculateUserPoints(user.id);

    revalidatePath('/attendance');
    revalidatePath('/members-only');

    return {
      success: true,
      status: 'success',
      eventName: event.name,
      points: event.points,
      scannedAt: nowIso,
      newTotalPoints,
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
