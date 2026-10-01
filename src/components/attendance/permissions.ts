export interface AttendancePermissions {
  canAccessGrid: boolean;
  isFullOfficer: boolean;
  canEditDues: boolean;
  canEditConcessions: boolean;
  canCreateEvents: boolean;
  allowedCategories: string[]; // e.g. ['brotherhood'], ['rush'], or ['all']
  canManageEvent: (event: { type?: string }) => boolean;
  canManageCategory: (category: string) => boolean;
  badgeLabel: string;
  roleTitle: string;
}

/**
 * Role matching helper for chapter roles and chairs
 */
export function parseAttendancePermissions(rawRole?: string | null): AttendancePermissions {
  const role = (rawRole || '').trim().toLowerCase();

  // Full Executive Officers & Admins
  const isFullOfficer = [
    'regent',
    'vice regent',
    'scribe',
    'website chair',
    'web chair',
    'website',
    'admin',
  ].some((r) => role === r || role.includes(r));

  if (isFullOfficer) {
    return {
      canAccessGrid: true,
      isFullOfficer: true,
      canEditDues: true,
      canEditConcessions: true,
      canCreateEvents: true,
      allowedCategories: ['all', 'rush', 'general', 'brotherhood', 'professional', 'service', 'study tables'],
      canManageEvent: () => true,
      canManageCategory: () => true,
      badgeLabel: 'Officer Privileges Active',
      roleTitle: rawRole || 'Executive Officer',
    };
  }

  // Specific Chairs and Officers
  const isTreasurer = role.includes('treasurer');
  const isFundraising = role.includes('fundrais');
  const isBrotherhoodChair = role.includes('brotherhood');
  const isPdChair = role.includes('pd') || role.includes('prof') || role.includes('professional');
  const isServiceChair = role.includes('service') || role.includes('com serv') || role.includes('community');
  const isRushChair = role.includes('rush');
  const isAcademicChair =
    role.includes('academic') ||
    role.includes('academics') ||
    role.includes('scholarship') ||
    role.includes('study table') ||
    role.includes('study');

  const allowedCategories: string[] = [];
  if (isBrotherhoodChair) {
    allowedCategories.push('Brotherhood', 'Alumni');
  }
  if (isPdChair) {
    allowedCategories.push('PD', 'PD w/ Company', 'Professional');
  }
  if (isServiceChair) {
    allowedCategories.push('Community Service', 'Cleanup / Housing Corps', 'Service');
  }
  if (isRushChair) {
    allowedCategories.push('Rush Events', 'Rush');
  }
  if (isAcademicChair) {
    allowedCategories.push('Academics', 'Sending in HW', 'Study Tables');
  }
  if (isFundraising) {
    allowedCategories.push('Fundraising', 'Concessions');
  }

  const canCreateEvents = allowedCategories.length > 0;
  const canAccessGrid = isTreasurer || isFundraising || canCreateEvents;

  const canManageCategory = (category: string): boolean => {
    if (isFullOfficer) return true;
    const c = (category || '').toLowerCase().trim();
    return allowedCategories.some((allowed) => {
      const a = allowed.toLowerCase().trim();
      return c === a || c.includes(a) || a.includes(c);
    });
  };

  const canManageEvent = (event: { type?: string }): boolean => {
    if (!event.type) return false;
    return canManageCategory(event.type);
  };

  // Human-friendly badge label
  let badgeLabel = 'Member View';
  if (role === 'pnm' || role === 'pledging member' || role.includes('pledg')) badgeLabel = 'Pledging Member View';
  else if (isTreasurer) badgeLabel = 'Treasurer Active';
  else if (isFundraising) badgeLabel = 'Fundraising Chair Active';
  else if (isBrotherhoodChair) badgeLabel = 'Brotherhood Chair Active';
  else if (isPdChair) badgeLabel = 'PD Chair Active';
  else if (isServiceChair) badgeLabel = 'Service Chair Active';
  else if (isRushChair) badgeLabel = 'Rush Chair Active';
  else if (isAcademicChair) badgeLabel = 'Academic Chair Active';

  return {
    canAccessGrid,
    isFullOfficer: false,
    canEditDues: isTreasurer,
    canEditConcessions: isFundraising,
    canCreateEvents,
    allowedCategories,
    canManageEvent,
    canManageCategory,
    badgeLabel,
    roleTitle: rawRole || 'Member',
  };
}
