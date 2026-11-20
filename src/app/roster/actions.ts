'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RosterMember } from '@/lib/roster-utils';

interface RawProfileRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  role?: string | null;
  status?: string | null;
  major?: string | null;
  pledge_class?: string | null;
  graduation_year?: number | null;
  attendance_points?: number | null;
  dues_paid?: boolean | null;
  concessions_done?: boolean | null;
  dues_excused?: boolean | null;
  concessions_excused?: boolean | null;
  brotherhood_met?: boolean | null;
  prof_dev_met?: boolean | null;
  comm_service_met?: boolean | null;
}

/**
 * Checks whether a role string represents a Pledging Member / PNM.
 */
function isPnmRole(role?: string | null): boolean {
  const r = (role || '').trim().toLowerCase();
  return r === 'pnm' || r === 'pledging member' || r.includes('pledg');
}

/**
 * Fetches all Supabase Auth user emails keyed by user ID.
 */
async function fetchAuthEmailMap(admin: ReturnType<typeof createAdminClient>): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();
  const perPage = 1000;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users || data.users.length === 0) {
      break;
    }
    for (const authUser of data.users) {
      if (authUser.id && authUser.email) {
        emailMap.set(authUser.id, authUser.email.trim().toLowerCase());
      }
    }
    if (data.users.length < perPage) {
      break;
    }
  }

  return emailMap;
}

/**
 * Fetches the full active and PNM member roster with emails, academic info, and standing.
 */
export async function getMemberRosterAction(): Promise<{
  members: RosterMember[];
  isPnmUser: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { members: [], isPnmUser: false, error: 'Unauthorized: Please log in.' };
    }

    const admin = createAdminClient();

    // Check caller's role to enforce non-PNM access
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (isPnmRole(callerProfile?.role)) {
      return { members: [], isPnmUser: true, error: 'Forbidden: PNMs cannot access the chapter roster.' };
    }

    const fullCols =
      'id, first_name, last_name, username, role, status, major, pledge_class, graduation_year, attendance_points, dues_paid, concessions_done, dues_excused, concessions_excused, brotherhood_met, prof_dev_met, comm_service_met';
    const basicCols =
      'id, first_name, last_name, username, role, major, pledge_class, graduation_year, attendance_points, dues_paid, concessions_done, brotherhood_met, prof_dev_met, comm_service_met';

    let rows: RawProfileRow[] = [];
    const { data: fullData, error: fullError } = await admin
      .from('profiles')
      .select(fullCols)
      .order('last_name', { ascending: true });

    if (!fullError && fullData) {
      rows = fullData as unknown as RawProfileRow[];
    } else {
      const { data: basicData, error: basicError } = await admin
        .from('profiles')
        .select(basicCols)
        .order('last_name', { ascending: true });

      if (basicError) {
        return { members: [], isPnmUser: false, error: basicError.message };
      }
      rows = (basicData || []) as unknown as RawProfileRow[];
    }

    const emailMap = await fetchAuthEmailMap(admin);

    const members: RosterMember[] = rows
      .filter((row) => (row.status || 'ACTIVE').toUpperCase() !== 'ALUMNI')
      .map((row) => {
        const username = (row.username || '').trim();
        const rawFirst = (row.first_name || '').trim();
        const rawLast = (row.last_name || '').trim();
        const firstValid = rawFirst && rawFirst !== 'TEMP' ? rawFirst : null;
        const lastValid = rawLast && rawLast !== 'TEMP' ? rawLast : null;
        const isPendingSetup = !firstValid || !lastValid;

        let fullName = '';
        if (firstValid && lastValid) {
          fullName = `${firstValid} ${lastValid}`;
        } else if (firstValid) {
          fullName = firstValid;
        } else if (lastValid) {
          fullName = lastValid;
        } else {
          fullName = username ? `@${username}` : 'Pending Member';
        }

        const authEmail = emailMap.get(row.id);
        const fallbackEmail = username
          ? username.includes('@')
            ? username.toLowerCase()
            : `${username.toLowerCase()}@wisc.edu`
          : '';

        const rawRole = (row.role || 'Member').trim() || 'Member';
        const pnm = isPnmRole(rawRole);
        const role = pnm ? 'PNM' : rawRole;
        const status = (row.status || 'ACTIVE').trim().toUpperCase() || 'ACTIVE';
        const rawMajor = (row.major || '').trim();
        const rawPledgeClass = (row.pledge_class || '').trim();
        const gradYear =
          row.graduation_year && Number(row.graduation_year) > 0 ? Number(row.graduation_year) : null;

        return {
          id: row.id,
          first_name: firstValid,
          last_name: lastValid,
          full_name: fullName,
          username,
          email: authEmail || fallbackEmail,
          role,
          roster_type: pnm ? 'PNM' : 'Active',
          status,
          major: rawMajor && rawMajor !== 'TEMP' ? rawMajor : null,
          pledge_class: rawPledgeClass && rawPledgeClass !== 'TEMP' ? rawPledgeClass : null,
          graduation_year: gradYear,
          attendance_points: Number(row.attendance_points) || 0,
          dues_paid: !!row.dues_paid,
          concessions_done: !!row.concessions_done,
          dues_excused: !!row.dues_excused,
          concessions_excused: pnm || !!row.concessions_excused,
          brotherhood_met: !!row.brotherhood_met,
          prof_dev_met: !!row.prof_dev_met,
          comm_service_met: !!row.comm_service_met,
          is_pending_setup: isPendingSetup,
        };
      });

    return { members, isPnmUser: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load member roster';
    return { members: [], isPnmUser: false, error: message };
  }
}
