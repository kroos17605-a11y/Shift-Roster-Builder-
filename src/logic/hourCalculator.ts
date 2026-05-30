import type { Employee, Shift, WeeklySummary } from '../types';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function getShiftDuration(shifts: Shift[]): number {
  let total = 0;
  for (const s of shifts) {
    total += timeToMinutes(s.endTime) - timeToMinutes(s.startTime);
  }
  return Math.round((total / 60) * 10) / 10;
}

export function getShiftDurationSingle(shift: Shift): number {
  const mins = timeToMinutes(shift.endTime) - timeToMinutes(shift.startTime);
  return Math.round((mins / 60) * 10) / 10;
}

export function getWeeklySummaries(employees: Employee[], shifts: Shift[]): WeeklySummary[] {
  return employees.map(emp => {
    const empShifts = shifts.filter(s => s.employeeId === emp.id);
    const totalHours = getShiftDuration(empShifts);
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      roleNames: emp.role,
      totalHours,
      shiftCount: empShifts.length,
    };
  });
}
