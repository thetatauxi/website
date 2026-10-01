export interface StandardEventType {
  id: string;
  name: string;
  defaultPoints: number;
  category: 'academics' | 'brotherhood' | 'professional' | 'service' | 'fundraising' | 'rush' | 'general';
}

export const STANDARD_EVENT_TYPES: StandardEventType[] = [
  { id: 'Academics', name: 'Academics', defaultPoints: 5, category: 'academics' },
  { id: 'ALPS Training', name: 'ALPS Training', defaultPoints: 10, category: 'general' },
  { id: 'Alumni', name: 'Alumni', defaultPoints: 25, category: 'brotherhood' },
  { id: 'Brotherhood', name: 'Brotherhood', defaultPoints: 10, category: 'brotherhood' },
  { id: 'Cleanup / Housing Corps', name: 'Cleanup / Housing Corps', defaultPoints: 25, category: 'service' },
  { id: 'Community Service', name: 'Community Service', defaultPoints: 20, category: 'service' },
  { id: 'Concessions', name: 'Concessions', defaultPoints: 30, category: 'fundraising' },
  { id: 'DEI Events', name: 'DEI Events', defaultPoints: 20, category: 'general' },
  { id: 'Fundraising', name: 'Fundraising', defaultPoints: 15, category: 'fundraising' },
  { id: 'Meetings', name: 'Meetings', defaultPoints: 5, category: 'general' },
  { id: 'PD', name: 'PD', defaultPoints: 15, category: 'professional' },
  { id: 'PD w/ Company', name: 'PD w/ Company', defaultPoints: 30, category: 'professional' },
  { id: 'Pledge Events', name: 'Pledge Events', defaultPoints: 15, category: 'general' },
  { id: 'Regionals', name: 'Regionals', defaultPoints: 35, category: 'general' },
  { id: 'Rush Events', name: 'Rush Events', defaultPoints: 15, category: 'rush' },
  { id: 'Sending in HW', name: 'Sending in HW', defaultPoints: 1, category: 'academics' },
];

export const EVENT_POINTS_MAP: Record<string, number> = Object.fromEntries(
  STANDARD_EVENT_TYPES.map((t) => [t.name.toLowerCase(), t.defaultPoints])
);

export function getDefaultPointsForEventType(type: string): number {
  const normalized = (type || '').trim().toLowerCase();
  return EVENT_POINTS_MAP[normalized] ?? 0;
}
