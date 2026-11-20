export type RosterType = 'Active' | 'PNM';

export interface RosterMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  username: string;
  email: string;
  role: string;
  roster_type: RosterType;
  status: string;
  major: string | null;
  pledge_class: string | null;
  graduation_year: number | null;
  attendance_points: number;
  dues_paid: boolean;
  concessions_done: boolean;
  dues_excused: boolean;
  concessions_excused: boolean;
  brotherhood_met: boolean;
  prof_dev_met: boolean;
  comm_service_met: boolean;
  is_pending_setup: boolean;
}

export type DistributionDimension =
  | 'pledge_class'
  | 'graduation_year'
  | 'major'
  | 'roster_type'
  | 'status'
  | 'role';

export const UNASSIGNED_LABEL = 'Unassigned';

const SEASON_ORDER: Record<string, number> = {
  spring: 0,
  summer: 1,
  fall: 2,
  winter: 3,
};

/**
 * Parses a pledge class string (e.g. "Fall 2024", "Spring 2026") into a sortable numeric key.
 */
function parsePledgeClassKey(value: string): { year: number; season: number } | null {
  const trimmed = value.trim().toLowerCase();
  const fullMatch = trimmed.match(/^(spring|summer|fall|winter)\s+(\d{4})$/);
  if (fullMatch) {
    return {
      year: Number.parseInt(fullMatch[2], 10),
      season: SEASON_ORDER[fullMatch[1]] ?? 99,
    };
  }
  const shortMatch = trimmed.match(/^([sf])\s*(\d{2,4})$/);
  if (shortMatch) {
    const yrRaw = Number.parseInt(shortMatch[2], 10);
    const year = yrRaw < 100 ? 2000 + yrRaw : yrRaw;
    const season = shortMatch[1] === 's' ? 0 : 2;
    return { year, season };
  }
  return null;
}

/**
 * Chronologically compares two pledge class strings; places Unassigned/empty last.
 */
export function comparePledgeClasses(a: string | null | undefined, b: string | null | undefined): number {
  const aVal = (a || '').trim();
  const bVal = (b || '').trim();
  const aMissing = !aVal || aVal === UNASSIGNED_LABEL;
  const bMissing = !bVal || bVal === UNASSIGNED_LABEL;

  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;

  const aParsed = parsePledgeClassKey(aVal);
  const bParsed = parsePledgeClassKey(bVal);

  if (aParsed && bParsed) {
    if (aParsed.year !== bParsed.year) {
      return aParsed.year - bParsed.year;
    }
    if (aParsed.season !== bParsed.season) {
      return aParsed.season - bParsed.season;
    }
  } else if (aParsed) {
    return -1;
  } else if (bParsed) {
    return 1;
  }

  return aVal.localeCompare(bVal);
}

/**
 * Formats a member status code into a human-friendly label.
 */
export function formatMemberStatus(status: string | null | undefined): string {
  const normalized = (status || 'ACTIVE').toUpperCase();
  switch (normalized) {
    case 'ACTIVE':
      return 'Active';
    case 'ACTIVE_COOP':
      return 'Active Co-op';
    case 'INACTIVE_COOP':
      return 'Inactive Co-op';
    case 'ABROAD':
      return 'Abroad';
    case 'ALUMNI':
      return 'Alumni';
    case 'OTHER':
      return 'Other';
    default:
      return normalized;
  }
}

/**
 * Escapes a single CSV field and neutralizes spreadsheet formula prefixes.
 */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Builds a CSV string for a list of roster members.
 */
export function buildRosterCsv(members: RosterMember[]): string {
  const headers = [
    'First Name',
    'Last Name',
    'Full Name',
    'Username',
    'Email',
    'Roster Type',
    'Role',
    'Standing',
    'Pledge Class',
    'Graduation Year',
    'Major',
    'Attendance Points',
    'Dues Paid',
    'Dues Excused',
    'Concessions Done',
    'Concessions Excused',
  ];

  const rows = members.map((m) => [
    escapeCsvCell(m.first_name && m.first_name !== 'TEMP' ? m.first_name : ''),
    escapeCsvCell(m.last_name && m.last_name !== 'TEMP' ? m.last_name : ''),
    escapeCsvCell(m.full_name),
    escapeCsvCell(m.username),
    escapeCsvCell(m.email),
    escapeCsvCell(m.roster_type),
    escapeCsvCell(m.role),
    escapeCsvCell(formatMemberStatus(m.status)),
    escapeCsvCell(m.pledge_class || ''),
    escapeCsvCell(m.graduation_year ?? ''),
    escapeCsvCell(m.major || ''),
    escapeCsvCell(m.attendance_points),
    escapeCsvCell(m.dues_paid ? 'Yes' : 'No'),
    escapeCsvCell(m.dues_excused ? 'Yes' : 'No'),
    escapeCsvCell(m.concessions_done ? 'Yes' : 'No'),
    escapeCsvCell(m.concessions_excused ? 'Yes' : 'No'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
