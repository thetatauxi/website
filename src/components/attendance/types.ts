export interface AttendanceEvent {
  id: string;
  name: string;
  date: string;
  points: number;
  type: string; // 'rush' | 'brotherhood' | 'professional' | 'service' | 'concessions' | 'general'
  is_active: boolean;
  code: string;
  created_at: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  event_id: string;
  user_id: string;
  status: 'present' | 'excused' | 'absent';
  points_awarded: number;
  scanned_at: string;
  verified_by?: string;
}

export interface MemberProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  role?: string | null;
  attendance_points: number;
}

export type EventCategory =
  | 'all'
  | 'rush'
  | 'brotherhood'
  | 'professional'
  | 'service'
  | 'concessions'
  | 'general';

export interface AttendanceFilterState {
  memberSearch: string;
  eventSearch: string;
  typeFilter: EventCategory;
  minPoints: string;
  maxPoints: string;
  sortOrder: 'newest' | 'oldest';
}
