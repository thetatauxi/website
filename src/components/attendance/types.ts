export interface AttendanceEvent {
  id: string;
  name: string;
  date: string;
  points: number;
  type: string; // 'rush' | 'brotherhood' | 'professional' | 'service' | 'study tables' | 'general'
  is_active: boolean;
  code: string;
  created_at: string;
  updated_at?: string;
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'empty';

export type MemberStatus =
  | 'ACTIVE'
  | 'ACTIVE_COOP'
  | 'INACTIVE_COOP'
  | 'ABROAD'
  | 'ALUMNI'
  | 'OTHER';

export interface AttendanceRecord {
  id: string;
  event_id: string;
  user_id: string;
  status: AttendanceStatus | 'absent';
  points_awarded: number;
  scanned_at: string;
  verified_by?: string;
}

export interface MemberProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  email?: string | null;
  role?: string | null;
  attendance_points: number;
  dues_paid?: boolean;
  concessions_done?: boolean;
  dues_excused?: boolean;
  concessions_excused?: boolean;
  status?: MemberStatus | string | null;
  brotherhood_met?: boolean;
  prof_dev_met?: boolean;
  comm_service_met?: boolean;
}

export type EventCategory = string;

export interface AttendanceFilterState {
  memberSearch: string;
  eventSearch: string;
  typeFilter: EventCategory;
  minPoints: string;
  maxPoints: string;
  sortOrder: 'newest' | 'oldest';
}
