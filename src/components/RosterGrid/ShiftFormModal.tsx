import { useState, useEffect } from 'react';
import { Dialog } from '../ui/dialog';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { useRoster } from '../../context/RosterContext';
import type { DayOfWeek, Shift } from '../../types';
import { DAYS_OF_WEEK } from '../../types';
import { getDateFromDay, isAvailable } from '../../logic/rosterUtils';

interface Props {
  mode: 'add' | 'edit';
  shift?: Shift;
  defaultEmployeeId?: string;
  defaultDay?: DayOfWeek;
  isOpen: boolean;
  onClose: () => void;
}

export function ShiftFormModal({ mode, shift, defaultEmployeeId, defaultDay, isOpen, onClose }: Props) {
  const { state, dispatch } = useRoster();
  const [employeeId, setEmployeeId] = useState('');
  const [day, setDay] = useState<DayOfWeek>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && shift) {
      setEmployeeId(shift.employeeId);
      setDay(shift.day);
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
    } else {
      setEmployeeId(defaultEmployeeId || '');
      setDay(defaultDay || 'Monday');
      setStartTime('09:00');
      setEndTime('17:00');
    }
    setError('');
  }, [mode, shift, defaultEmployeeId, defaultDay, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError('Please select an employee');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    if (mode === 'add') {
      const date = getDateFromDay(state.weekStartDate, day);
      dispatch({ type: 'ADD_SHIFT', payload: { employeeId, day, date, startTime, endTime } });
    } else if (shift) {
      // Recompute date if day changed, otherwise keep existing date
      const date = day !== shift.day
        ? getDateFromDay(state.weekStartDate, day)
        : shift.date;
      dispatch({ type: 'UPDATE_SHIFT', payload: { id: shift.id, employeeId, day, date, startTime, endTime } });
    }
    onClose();
  };

  const employeeOptions = state.employees.map(e => ({ value: e.id, label: e.name }));
  const dayOptions = DAYS_OF_WEEK.map(d => ({ value: d, label: d }));

  // Availability warning
  const selectedEmp = state.employees.find(e => e.id === employeeId);
  const shiftDate = getDateFromDay(state.weekStartDate, day);
  const availability = selectedEmp
    ? isAvailable(selectedEmp, shiftDate, day, startTime, endTime)
    : { available: true };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Assign Shift' : 'Edit Shift'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label="Employee"
          value={employeeId}
          onChange={e => { setEmployeeId(e.target.value); setError(''); }}
          options={employeeOptions}
          placeholder="Select employee..."
        />
        <Select
          label="Day"
          value={day}
          onChange={e => setDay(e.target.value as DayOfWeek)}
          options={dayOptions}
        />
        {!availability.available && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            Warning: {availability.reason}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={e => { setStartTime(e.target.value); setError(''); }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={e => { setEndTime(e.target.value); setError(''); }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex items-center justify-between pt-2">
          {mode === 'edit' && shift ? (
            <Button variant="danger" size="sm" type="button" onClick={() => {
              dispatch({ type: 'REMOVE_SHIFT', payload: { id: shift.id } });
              onClose();
            }}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit">{mode === 'add' ? 'Assign' : 'Save'}</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
