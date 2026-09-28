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
  if (isBrotherhoodChair) allowedCategories.push('brotherhood');
  if (isPdChair) allowedCategories.push('professional');
  if (isServiceChair) allowedCategories.push('service');
  if (isRushChair) allowedCategories.push('rush');
  if (isAcademicChair) allowedCategories.push('study tables');

  const canCreateEvents = allowedCategories.length > 0;
  const canAccessGrid = isTreasurer || isFundraising || canCreateEvents;

  const canManageCategory = (category: string): boolean => {
    return allowedCategories.includes(category.toLowerCase().trim());
  };

  const canManageEvent = (event: { type?: string }): boolean => {
    if (!event.type) return false;
    return canManageCategory(event.type);
  };

  // Human-friendly badge label
  let badgeLabel = 'Member View';
  if (isTreasurer) badgeLabel = 'Treasurer Active';
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
