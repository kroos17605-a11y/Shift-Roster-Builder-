import { useState, useMemo, useEffect } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { MiniCalendar } from './MiniCalendar';
import { useRoster } from '../context/RosterContext';
import { getShiftsForWeek, groupBy } from '../logic/rosterUtils';
import { DAYS_OF_WEEK, type DayOfWeek } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

export function CopyWeekModal({ isOpen, onClose }: Props) {
  const { state, dispatch } = useRoster();
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [error, setError] = useState('');

  const weekShifts = getShiftsForWeek(state.shifts, state.weekStartDate);
  const shiftsByDay = useMemo(() => groupBy(weekShifts, s => s.day), [weekShifts]);

  // Days that actually have shifts in current week
  const activeDays = DAYS_OF_WEEK.filter(d => shiftsByDay.has(d));

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedDays([...activeDays]);
    }
  }, [isOpen, activeDays.join(',')]);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleClose = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setError('');
    onClose();
  };

  const handleCopy = () => {
    if (!rangeStart || !rangeEnd) {
      setError('Please select a date range by clicking a start date, then an end date.');
      return;
    }
    if (selectedDays.length === 0) {
      setError('Please select at least one day to copy.');
      return;
    }
    dispatch({
      type: 'COPY_TO_RANGE',
      payload: {
        fromDate: rangeStart,
        toDate: rangeEnd,
        days: selectedDays.length === activeDays.length ? undefined : selectedDays,
      },
    });
    handleClose();
  };

  const rangeLabel = rangeStart
    ? rangeEnd
      ? `${rangeStart} — ${rangeEnd}`
      : `${rangeStart} — ? (click end date)`
    : 'Click a date to begin';

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Copy Schedule to Date Range">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          Copy shifts from the current week. Click a start date, then an end date on the calendar.
          Shifts are added without overwriting existing ones.
        </p>

        {weekShifts.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            Current week has no shifts to copy.
          </p>
        ) : (
          <>
            {/* Day filter toggles */}
            <div className="flex flex-wrap gap-1.5">
              {activeDays.map(day => {
                const count = shiftsByDay.get(day)?.length || 0;
                const selected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                      selected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-500'
                    }`}
                  >
                    {DAY_SHORT[day]} ({count})
                  </button>
                );
              })}
              {selectedDays.length < activeDays.length && (
                <button
                  onClick={() => setSelectedDays([...activeDays])}
                  className="px-2 py-1 text-xs text-cyan-600 hover:text-cyan-700 cursor-pointer"
                >
                  Select all
                </button>
              )}
            </div>

            <p className="text-sm font-medium text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg text-center">
              {rangeLabel}
            </p>

            <MiniCalendar
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onChange={(start, end) => {
                setRangeStart(start);
                setRangeEnd(end);
                setError('');
              }}
            />
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={() => { setRangeStart(null); setRangeEnd(null); }}>
            Clear selection
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose} type="button">Cancel</Button>
            <Button onClick={handleCopy} disabled={!rangeStart || !rangeEnd || weekShifts.length === 0}>
              Copy
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
