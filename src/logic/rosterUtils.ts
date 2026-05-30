import type { DayOfWeek, Shift, Employee } from '../types';
import { DAYS_OF_WEEK } from '../types';

export function groupBy<T, K>(arr: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of arr) {
    const key = keyFn(item);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

export function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekDateRange(weekStart: string): { label: string; date: string; dayOfWeek: DayOfWeek }[] {
  const [y, m, d] = weekStart.split('-').map(Number);
  const base = new Date(y, m - 1, d);

  const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return DAYS_OF_WEEK.map((day, i) => {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    const month = date.getMonth() + 1;
    const dom = date.getDate();
    return {
      label: `${shortDays[i]}\n${month}/${dom}`,
      date: formatDate(date),
      dayOfWeek: day,
    };
  });
}

/** Compute the concrete date (YYYY-MM-DD) for a given weekStart + day */
export function getDateFromDay(weekStart: string, day: DayOfWeek): string {
  const [y, m, d] = weekStart.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const offset = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day);
  base.setDate(base.getDate() + offset);
  return formatDate(base);
}

/** Check if a shift conflicts with an employee's unavailable slots for a given date + day */
export function isAvailable(employee: Employee, date: string, day: DayOfWeek, startTime: string, endTime: string): { available: boolean; reason?: string } {
  for (const slot of employee.unavailableSlots) {
    // Check date range
    if (slot.dateFrom && date < slot.dateFrom) continue;
    if (slot.dateTo && date > slot.dateTo) continue;

    // Check day-of-week filter
    if (slot.days && slot.days.length > 0 && !slot.days.includes(day)) continue;

    // Check time ranges
    const ranges = slot.timeRanges;
    if (!ranges || ranges.length === 0) {
      // No time range = all day
      return { available: false, reason: 'Unavailable all day' };
    }
    for (const tr of ranges) {
      if (startTime < tr.endTime && tr.startTime < endTime) {
        return { available: false, reason: `Unavailable ${tr.startTime}-${tr.endTime}` };
      }
    }
  }
  return { available: true };
}

/** Filter shifts that fall within the given week (Mon-Sun) */
export function getShiftsForWeek(shifts: Shift[], weekStart: string): Shift[] {
  const [y, m, d] = weekStart.split('-').map(Number);
  const weekEnd = new Date(y, m - 1, d);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = formatDate(weekEnd);
  return shifts.filter(s => s.date >= weekStart && s.date <= weekEndStr);
}

export function getShiftsForDay(shifts: Shift[], employeeId: string, day: DayOfWeek): Shift[] {
  return shifts.filter(s => s.employeeId === employeeId && s.day === day);
}

export function getTodayString(): string {
  return formatDate(new Date());
}

export function isToday(weekStart: string, dayIndex: number): boolean {
  const [y, m, d] = weekStart.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const target = new Date(base);
  target.setDate(base.getDate() + dayIndex);
  const today = new Date();
  return formatDate(target) === formatDate(today);
}

/** Get all dates in [fromDate, toDate] that match a given day of week */
export function getMatchingDatesInRange(fromDate: string, toDate: string, day: DayOfWeek): string[] {
  const [fy, fm, fd] = fromDate.split('-').map(Number);
  const [ty, tm, td] = toDate.split('-').map(Number);
  const start = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);

  const DAY_INDEX = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const targetIdx = DAY_INDEX.indexOf(day);

  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    const jsDay = current.getDay(); // 0=Sun, 1=Mon, ...
    const ourIdx = jsDay === 0 ? 6 : jsDay - 1;
    if (ourIdx === targetIdx) {
      dates.push(formatDate(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/** Generate CSV string for the current week's roster */
export function generateCsv(employees: Employee[], shifts: Shift[], weekStart: string): string {
  const weekShifts = getShiftsForWeek(shifts, weekStart);
  const weekDays = getWeekDateRange(weekStart);
  const headers = ['Employee', ...weekDays.map(d => d.label.replace('\n', ' ')), 'Total Hours'];

  const rows: string[][] = [];
  for (const emp of employees) {
    const row: string[] = [emp.name];
    let totalMins = 0;
    for (const wd of weekDays) {
      const dayShifts = weekShifts.filter(s => s.employeeId === emp.id && s.date === wd.date);
      if (dayShifts.length === 0) {
        row.push('');
      } else {
        const parts = dayShifts.map(s => `${s.startTime}-${s.endTime}`);
        row.push(parts.join('; '));
        for (const s of dayShifts) {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          totalMins += (eh * 60 + em) - (sh * 60 + sm);
        }
      }
    }
    row.push((totalMins / 60).toFixed(1) + 'h');
    rows.push(row);
  }

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

/** Download a string as a file */
export function downloadFile(content: string, filename: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Generate labels for upcoming N weeks (for the copy modal) */
export function getUpcomingWeeks(fromWeekStart: string, count: number): { weekStart: string; label: string }[] {
  const [y, m, d] = fromWeekStart.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const weeks: { weekStart: string; label: string }[] = [];

  for (let i = 0; i < count; i++) {
    const ws = new Date(base);
    ws.setDate(base.getDate() + i * 7);
    const wsStr = formatDate(ws);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);

    const startLabel = `${ws.getMonth() + 1}/${ws.getDate()}`;
    const endLabel = `${we.getMonth() + 1}/${we.getDate()}`;
    weeks.push({
      weekStart: wsStr,
      label: `${startLabel} - ${endLabel}`,
    });
  }

  return weeks;
}
