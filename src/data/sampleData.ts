import type { Employee, Shift, DayOfWeek } from '../types';
import { getWeekStartDate, getDateFromDay } from '../logic/rosterUtils';

const thisWeek = getWeekStartDate(new Date());
function addWeeks(date: string, weeks: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + weeks * 7);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
const nextWeek = addWeeks(thisWeek, 1);

export const sampleEmployees: Employee[] = [
  { id: crypto.randomUUID(), name: 'Alice', roles: ['Supervisor'], unavailableSlots: [{ days: ['Sunday'] }] },
  { id: crypto.randomUUID(), name: 'Bob',   roles: ['Cook'],       unavailableSlots: [] },
  { id: crypto.randomUUID(), name: 'Carol', roles: ['Cashier'],    unavailableSlots: [] },
  { id: crypto.randomUUID(), name: 'David', roles: ['Dishwasher'], unavailableSlots: [] },
  { id: crypto.randomUUID(), name: 'Eve',   roles: ['Cashier'],    unavailableSlots: [] },
];

function s(emp: Employee, day: DayOfWeek, start: string, end: string, weekStart = thisWeek): Shift {
  return { id: crypto.randomUUID(), employeeId: emp.id, date: getDateFromDay(weekStart, day), day, startTime: start, endTime: end };
}

export const sampleShifts: Shift[] = [
  // === THIS WEEK ===

  // Alice: Mon-Fri clean, but Sunday 10-16 (UNAVAILABLE — she can't work Sundays → move to Eve)
  s(sampleEmployees[0], 'Monday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Tuesday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Wednesday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Thursday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Friday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Sunday', '10:00', '16:00'),

  // Bob: Mon-Sat 6 consecutive (CONSECUTIVE — swap Wed with David)
  s(sampleEmployees[1], 'Monday', '10:00', '18:00'),
  s(sampleEmployees[1], 'Tuesday', '10:00', '18:00'),
  s(sampleEmployees[1], 'Wednesday', '10:00', '18:00'),
  s(sampleEmployees[1], 'Thursday', '10:00', '18:00'),
  s(sampleEmployees[1], 'Friday', '10:00', '18:00'),
  s(sampleEmployees[1], 'Saturday', '10:00', '14:00'),

  // Carol: Wed overlap 13-21 vs 15-23 (OVERLAP — swap one with Eve on Wed)
  s(sampleEmployees[2], 'Tuesday', '13:00', '21:00'),
  s(sampleEmployees[2], 'Wednesday', '13:00', '21:00'),
  s(sampleEmployees[2], 'Wednesday', '15:00', '23:00'),
  s(sampleEmployees[2], 'Thursday', '13:00', '21:00'),
  s(sampleEmployees[2], 'Friday', '13:00', '21:00'),

  // David: scattered, available for swaps (has Wed for Bob's swap)
  s(sampleEmployees[3], 'Monday', '08:00', '14:00'),
  s(sampleEmployees[3], 'Wednesday', '08:00', '14:00'),
  s(sampleEmployees[3], 'Friday', '08:00', '14:00'),

  // Eve: scattered, available for swaps (has Wed for Carol's swap, free Sunday for Alice)
  s(sampleEmployees[4], 'Tuesday', '09:00', '17:00'),
  s(sampleEmployees[4], 'Wednesday', '09:00', '17:00'),
  s(sampleEmployees[4], 'Thursday', '09:00', '17:00'),

  // === NEXT WEEK (cross-week) ===

  // Carol: Fri+Sat this week + Sun+Mon+Tue+Wed next week = 6 calendar days (CROSS-WEEK CONSECUTIVE)
  s(sampleEmployees[2], 'Saturday', '09:00', '17:00', thisWeek),
  s(sampleEmployees[2], 'Sunday', '09:00', '17:00', thisWeek),
  s(sampleEmployees[2], 'Monday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[2], 'Tuesday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[2], 'Wednesday', '09:00', '17:00', nextWeek),

  // Others next week — enough coverage for swaps
  s(sampleEmployees[0], 'Monday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[0], 'Wednesday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[1], 'Tuesday', '10:00', '18:00', nextWeek),
  s(sampleEmployees[1], 'Wednesday', '10:00', '18:00', nextWeek),
  s(sampleEmployees[3], 'Monday', '08:00', '14:00', nextWeek),
  s(sampleEmployees[3], 'Saturday', '08:00', '14:00', nextWeek),
  s(sampleEmployees[4], 'Thursday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[4], 'Friday', '09:00', '17:00', nextWeek),
];
