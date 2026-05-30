import { useState } from 'react';

interface Props {
  rangeStart: string | null;
  rangeEnd: string | null;
  onChange: (start: string | null, end: string | null) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function formatYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday=0
  const total = daysInMonth(year, month);
  const grid: (number | null)[] = [];
  for (let i = 0; i < offset; i++) grid.push(null);
  for (let d = 1; d <= total; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export function MiniCalendar({ rangeStart, rangeEnd, onChange }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [pendingStart, setPendingStart] = useState<string | null>(rangeStart);

  // Sync external reset
  if (rangeStart === null && rangeEnd === null && pendingStart !== null) {
    // externally cleared
  }

  const grid = getMonthGrid(viewYear, viewMonth);

  const isInRange = (dateStr: string) => {
    if (!rangeStart || !rangeEnd) return false;
    return dateStr >= rangeStart && dateStr <= rangeEnd;
  };

  const isStart = (dateStr: string) => rangeStart === dateStr;
  const isEnd = (dateStr: string) => rangeEnd === dateStr;
  const isToday = (dateStr: string) => dateStr === formatYMD(today.getFullYear(), today.getMonth(), today.getDate());

  const handleClick = (day: number) => {
    const dateStr = formatYMD(viewYear, viewMonth, day);

    if (!rangeStart || (rangeStart && rangeEnd)) {
      // Start fresh
      onChange(dateStr, null);
    } else {
      // Set end; swap if needed
      if (dateStr < rangeStart) {
        onChange(dateStr, rangeStart);
      } else {
        onChange(rangeStart, dateStr);
      }
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5l-5 5 5 5" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-700">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 5l5 5-5 5" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(dh => (
          <div key={dh} className="text-center text-[11px] font-medium text-slate-400 py-1">
            {dh}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((day, i) => {
          if (day === null) {
            return <div key={`e-${i}`} />;
          }
          const dateStr = formatYMD(viewYear, viewMonth, day);
          const inRange = isInRange(dateStr);
          const start = isStart(dateStr);
          const end = isEnd(dateStr);
          const todayCell = isToday(dateStr);

          let cellClass = 'text-center py-1.5 text-sm rounded cursor-pointer transition-colors ';
          if (start || end) {
            cellClass += 'bg-cyan-600 text-white font-semibold';
          } else if (inRange) {
            cellClass += 'bg-cyan-100 text-cyan-800';
          } else if (todayCell) {
            cellClass += 'text-cyan-600 font-bold hover:bg-slate-100';
          } else {
            cellClass += 'text-slate-700 hover:bg-slate-100';
          }

          return (
            <button
              key={i}
              onClick={() => handleClick(day)}
              className={cellClass}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
