import type { Conflict, Shift, Employee } from '../types';
import { groupBy, isAvailable } from './rosterUtils';

export function detectAllConflicts(shifts: Shift[], employees: Employee[]): Conflict[] {
  return [
    ...detectOverlappingShifts(shifts),
    ...detectConsecutiveDays(shifts),
    ...detectUnavailable(shifts, employees),
  ];
}

function detectOverlappingShifts(shifts: Shift[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const byEmployee = groupBy(shifts, s => s.employeeId);

  for (const [empId, empShifts] of byEmployee) {
    const byDate = groupBy(empShifts, s => s.date);

    for (const [, dateShifts] of byDate) {
      if (dateShifts.length < 2) continue;

      for (let i = 0; i < dateShifts.length; i++) {
        for (let j = i + 1; j < dateShifts.length; j++) {
          const a = dateShifts[i];
          const b = dateShifts[j];

          if (a.startTime < b.endTime && b.startTime < a.endTime) {
            conflicts.push({
              type: 'overlap',
              employeeId: empId,
              description: `${a.day} ${a.date}: ${a.startTime}-${a.endTime} overlaps with ${b.startTime}-${b.endTime}`,
              involvedShiftIds: [a.id, b.id],
            });
          }
        }
      }
    }
  }

  return conflicts;
}

function detectConsecutiveDays(shifts: Shift[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const byEmployee = groupBy(shifts, s => s.employeeId);

  for (const [empId, empShifts] of byEmployee) {
    // Get sorted unique working dates (calendar-based, not day-of-week)
    const dates = [...new Set(empShifts.map(s => s.date))].sort();
    if (dates.length < 6) continue;

    // Find longest streak of consecutive calendar dates
    let maxStreak = 0;
    let currentStreak = 1;
    let streakEnd = 0;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T00:00:00');
      const curr = new Date(dates[i] + 'T00:00:00');
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
      } else {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          streakEnd = i - 1;
        }
        currentStreak = 1;
      }
    }
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
      streakEnd = dates.length - 1;
    }

    if (maxStreak > 5) {
      const streakStart = streakEnd - maxStreak + 1;
      const streakDates = dates.slice(streakStart, streakEnd + 1);
      const involvedIds = empShifts
        .filter(s => streakDates.includes(s.date))
        .map(s => s.id);

      const from = streakDates[0];
      const to = streakDates[streakDates.length - 1];

      conflicts.push({
        type: 'consecutive_days',
        employeeId: empId,
        description: `${maxStreak} consecutive calendar days ${from} → ${to} (limit: 5)`,
        involvedShiftIds: involvedIds,
      });
    }
  }

  return conflicts;
}

function detectUnavailable(shifts: Shift[], employees: Employee[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const empMap = new Map(employees.map(e => [e.id, e]));

  for (const s of shifts) {
    const emp = empMap.get(s.employeeId);
    if (!emp) continue;
    const avail = isAvailable(emp, s.date, s.day, s.startTime, s.endTime);
    if (!avail.available) {
      conflicts.push({
        type: 'unavailable',
        employeeId: s.employeeId,
        description: `${s.day} ${s.date} ${s.startTime}-${s.endTime}: ${avail.reason}`,
        involvedShiftIds: [s.id],
      });
    }
  }

  return conflicts;
}
