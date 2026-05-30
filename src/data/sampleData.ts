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
  { id: crypto.randomUUID(), name: 'Alice', role: 'Supervisor', unavailableSlots: [{ days: ['Sunday'] }] },
  { id: crypto.randomUUID(), name: 'Frank', role: 'Supervisor', unavailableSlots: [] },
  { id: crypto.randomUUID(), name: 'Bob',   role: 'Cook',       unavailableSlots: [] },
  { id: crypto.randomUUID(), name: 'David', role: 'Cook',       unavailableSlots: [] },
  { id: crypto.randomUUID(), name: 'Carol', role: 'Cashier',    unavailableSlots: [] },
  { id: crypto.randomUUID(), name: 'Eve',   role: 'Cashier',    unavailableSlots: [] },
];

function s(emp: Employee, day: DayOfWeek, start: string, end: string, weekStart = thisWeek): Shift {
  return { id: crypto.randomUUID(), employeeId: emp.id, date: getDateFromDay(weekStart, day), day, startTime: start, endTime: end };
}

export const sampleShifts: Shift[] = [
  // ===== THIS WEEK =====

  // Alice (Supervisor): Mon-Fri + Sunday
  // CONFLICT: Alice can't work Sundays → MOVE Sunday to Frank (Supervisor, free on Sun)
  s(sampleEmployees[0], 'Monday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Tuesday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Wednesday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Thursday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Friday', '09:00', '17:00'),
  s(sampleEmployees[0], 'Sunday', '10:00', '16:00'),

  // Frank (Supervisor): Mon/Wed/Fri only, FREE on Sunday
  s(sampleEmployees[1], 'Monday', '10:00', '18:00'),
  s(sampleEmployees[1], 'Wednesday', '10:00', '18:00'),
  s(sampleEmployees[1], 'Friday', '10:00', '18:00'),

  // Bob (Cook): Mon-Sat, 6 consecutive days
  // CONFLICT: 6 consecutive → MOVE Tue to David (Cook, FREE on Tue)
  s(sampleEmployees[2], 'Monday', '10:00', '18:00'),
  s(sampleEmployees[2], 'Tuesday', '10:00', '18:00'),
  s(sampleEmployees[2], 'Wednesday', '10:00', '18:00'),
  s(sampleEmployees[2], 'Thursday', '10:00', '18:00'),
  s(sampleEmployees[2], 'Friday', '10:00', '18:00'),
  s(sampleEmployees[2], 'Saturday', '10:00', '14:00'),

  // David (Cook): Mon/Wed/Fri only, FREE on Tue/Thu/Sat/Sun
  s(sampleEmployees[3], 'Monday', '08:00', '14:00'),
  s(sampleEmployees[3], 'Wednesday', '08:00', '14:00'),
  s(sampleEmployees[3], 'Friday', '08:00', '14:00'),

  // Carol (Cashier): Wed overlap 13-21 vs 15-23
  // CONFLICT: overlap → MOVE 15-23 to Eve (Cashier, works Wed 07-11, no overlap since 15>11)
  s(sampleEmployees[4], 'Tuesday', '13:00', '21:00'),
  s(sampleEmployees[4], 'Wednesday', '13:00', '21:00'),
  s(sampleEmployees[4], 'Wednesday', '15:00', '23:00'),
  s(sampleEmployees[4], 'Thursday', '13:00', '21:00'),
  s(sampleEmployees[4], 'Friday', '13:00', '21:00'),

  // Eve (Cashier): Tue/Wed/Thu, Wed shift 7-11 doesn't overlap with Carol's
  s(sampleEmployees[5], 'Tuesday', '09:00', '17:00'),
  s(sampleEmployees[5], 'Wednesday', '07:00', '11:00'),
  s(sampleEmployees[5], 'Thursday', '09:00', '17:00'),

  // ===== NEXT WEEK (cross-week) =====

  // Carol (Cashier): Fri+Sat+Sun this-week + Mon+Tue+Wed next-week = 6 calendar days
  // CONFLICT: cross-week consecutive → MOVE Wed(next week) to Eve (Cashier, FREE on Wed next week)
  s(sampleEmployees[4], 'Saturday', '09:00', '17:00', thisWeek),
  s(sampleEmployees[4], 'Sunday', '09:00', '17:00', thisWeek),
  s(sampleEmployees[4], 'Monday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[4], 'Tuesday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[4], 'Wednesday', '09:00', '17:00', nextWeek),

  // Others next week
  s(sampleEmployees[0], 'Monday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[0], 'Wednesday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[1], 'Tuesday', '10:00', '18:00', nextWeek),
  s(sampleEmployees[2], 'Tuesday', '10:00', '18:00', nextWeek),
  s(sampleEmployees[2], 'Wednesday', '10:00', '18:00', nextWeek),
  s(sampleEmployees[3], 'Monday', '08:00', '14:00', nextWeek),
  s(sampleEmployees[3], 'Saturday', '08:00', '14:00', nextWeek),
  s(sampleEmployees[5], 'Thursday', '09:00', '17:00', nextWeek),
  s(sampleEmployees[5], 'Friday', '09:00', '17:00', nextWeek),
  // Eve FREE on Wed next week → Carol's Wed can move here
];
