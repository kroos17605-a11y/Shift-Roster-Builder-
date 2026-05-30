export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimeRange {
  startTime: string;  // 'HH:MM'
  endTime: string;    // 'HH:MM'
}

export interface UnavailableSlot {
  dateFrom?: string;  // YYYY-MM-DD, empty = since forever
  dateTo?: string;    // YYYY-MM-DD, empty = until forever
  days?: DayOfWeek[]; // empty = every day
  timeRanges?: TimeRange[]; // empty = all day
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  unavailableSlots: UnavailableSlot[];
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string;    // 'YYYY-MM-DD', the concrete calendar date
  day: DayOfWeek;
  startTime: string; // 'HH:MM'
  endTime: string;   // 'HH:MM'
}

export interface Conflict {
  type: 'overlap' | 'consecutive_days' | 'unavailable';
  employeeId: string;
  description: string;
  involvedShiftIds: string[];
}

export interface WeeklySummary {
  employeeId: string;
  employeeName: string;
  roleNames: string;
  totalHours: number;
  shiftCount: number;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const DAY_ORDER: Record<DayOfWeek, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
  Friday: 4, Saturday: 5, Sunday: 6
};
