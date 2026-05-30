import { useState } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { MiniCalendar } from './MiniCalendar';
import { useRoster } from '../context/RosterContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ClearRangeModal({ isOpen, onClose }: Props) {
  const { state, dispatch } = useRoster();
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const shiftsInRange = rangeStart && rangeEnd
    ? state.shifts.filter(s => s.date >= rangeStart && s.date <= rangeEnd)
    : [];

  const handleClear = () => {
    if (!rangeStart || !rangeEnd) return;
    dispatch({ type: 'CLEAR_RANGE', payload: { fromDate: rangeStart, toDate: rangeEnd } });
    setRangeStart(null);
    setRangeEnd(null);
    onClose();
  };

  const handleClose = () => {
    setRangeStart(null);
    setRangeEnd(null);
    onClose();
  };

  const rangeLabel = rangeStart
    ? rangeEnd ? `${rangeStart} — ${rangeEnd}` : `${rangeStart} — ? (click end)`
    : 'Click a date to begin';

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Clear Shifts in Range">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          Select a date range to remove all shifts within it.
        </p>

        <p className="text-sm font-medium text-red-700 bg-red-50 px-3 py-1.5 rounded-lg text-center">
          {rangeLabel}
        </p>

        <MiniCalendar
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onChange={(start, end) => { setRangeStart(start); setRangeEnd(end); }}
        />

        {shiftsInRange.length > 0 && (
          <p className="text-xs text-red-600">
            {shiftsInRange.length} shift{shiftsInRange.length !== 1 ? 's' : ''} will be removed.
          </p>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={() => { setRangeStart(null); setRangeEnd(null); }}>
            Clear selection
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose} type="button">Cancel</Button>
            <Button variant="danger" onClick={handleClear}
              disabled={!rangeStart || !rangeEnd || shiftsInRange.length === 0}>
              Clear {shiftsInRange.length > 0 ? shiftsInRange.length : ''} Shift{shiftsInRange.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
