import { useState, useEffect } from 'react';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { MiniCalendar } from '../MiniCalendar';
import { useRoster } from '../../context/RosterContext';
import type { Employee, DayOfWeek, UnavailableSlot, TimeRange } from '../../types';
import { DAYS_OF_WEEK } from '../../types';

interface Props {
  mode: 'add' | 'edit';
  employee?: Employee;
  isOpen: boolean;
  onClose: () => void;
}

const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

function emptySlot(): UnavailableSlot {
  return { days: [], timeRanges: [] };
}

export function EmployeeFormModal({ mode, employee, isOpen, onClose }: Props) {
  const { dispatch } = useRoster();
  const [name, setName] = useState('');
  const [rolesText, setRolesText] = useState('');
  const [slots, setSlots] = useState<UnavailableSlot[]>([]);
  const [error, setError] = useState('');

  // Track which slot's calendar is open
  const [calendarSlot, setCalendarSlot] = useState<number | null>(null);
  const [calRange, setCalRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

  useEffect(() => {
    if (mode === 'edit' && employee) {
      setName(employee.name);
      setRolesText(employee.roles.join(', '));
      setSlots(employee.unavailableSlots?.length ? employee.unavailableSlots.map(s => ({ ...s })) : []);
    } else {
      setName('');
      setRolesText('');
      setSlots([]);
    }
    setError('');
    setCalendarSlot(null);
  }, [mode, employee, isOpen]);

  const updateSlot = (idx: number, patch: Partial<UnavailableSlot>) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const toggleDay = (idx: number, day: DayOfWeek) => {
    const slot = slots[idx];
    const current = slot.days || [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    updateSlot(idx, { days: next });
  };

  const addTimeRange = (idx: number) => {
    const slot = slots[idx];
    const ranges = [...(slot.timeRanges || []), { startTime: '09:00', endTime: '17:00' }];
    updateSlot(idx, { timeRanges: ranges });
  };

  const updateTimeRange = (slotIdx: number, rangeIdx: number, field: keyof TimeRange, value: string) => {
    setSlots(prev => prev.map((s, si) => {
      if (si !== slotIdx) return s;
      const ranges = [...(s.timeRanges || [])];
      ranges[rangeIdx] = { ...ranges[rangeIdx], [field]: value };
      return { ...s, timeRanges: ranges };
    }));
  };

  const removeTimeRange = (slotIdx: number, rangeIdx: number) => {
    setSlots(prev => prev.map((s, si) => {
      if (si !== slotIdx) return s;
      const ranges = (s.timeRanges || []).filter((_, ri) => ri !== rangeIdx);
      return { ...s, timeRanges: ranges };
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Name is required'); return; }
    const roles = rolesText.split(',').map(s => s.trim()).filter(Boolean);
    if (roles.length === 0) { setError('At least one role is required'); return; }

    // Clean: remove empty timeRanges arrays
    const cleanSlots = slots.map(s => ({
      ...s,
      timeRanges: s.timeRanges?.length ? s.timeRanges : undefined,
      days: s.days?.length ? s.days : undefined,
    }));

    if (mode === 'add') {
      dispatch({ type: 'ADD_EMPLOYEE', payload: { name: trimmedName, roles, unavailableSlots: cleanSlots } });
    } else if (employee) {
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: { id: employee.id, name: trimmedName, roles, unavailableSlots: cleanSlots } });
    }
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Employee' : 'Edit Employee'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        <Input label="Name" value={name} onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="e.g. Alice Chen" error={error} autoFocus />
        <Input label="Roles" value={rolesText} onChange={e => { setRolesText(e.target.value); setError(''); }}
          placeholder="e.g. Cashier, Supervisor (comma-separated)" />

        {/* Unavailability slots */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Unavailability</label>
            <Button variant="ghost" size="sm" type="button" onClick={() => setSlots(prev => [...prev, emptySlot()])}>
              + Add
            </Button>
          </div>

          {slots.map((slot, si) => (
            <div key={si} className="border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Rule #{si + 1}</span>
                <button type="button" onClick={() => setSlots(prev => prev.filter((_, i) => i !== si))}
                  className="text-xs text-red-400 hover:text-red-600">&times; Remove</button>
              </div>

              {/* Date range */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Date range (empty = always)</span>
                <div className="flex items-center gap-2">
                  <input type="date" value={slot.dateFrom || ''}
                    onChange={e => updateSlot(si, { dateFrom: e.target.value || undefined })}
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                  <span className="text-slate-400 text-xs">—</span>
                  <input type="date" value={slot.dateTo || ''}
                    onChange={e => updateSlot(si, { dateTo: e.target.value || undefined })}
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                  <Button variant="ghost" size="sm" type="button"
                    onClick={() => {
                      setCalendarSlot(si);
                      setCalRange({ start: slot.dateFrom || null, end: slot.dateTo || null });
                    }}>
                    &#128197;
                  </Button>
                </div>
                {calendarSlot === si && (
                  <div className="border border-slate-200 rounded-lg p-2">
                    <MiniCalendar
                      rangeStart={calRange.start}
                      rangeEnd={calRange.end}
                      onChange={(start, end) => {
                        setCalRange({ start, end });
                        updateSlot(si, { dateFrom: start || undefined, dateTo: end || undefined });
                      }}
                    />
                    <button type="button" onClick={() => setCalendarSlot(null)}
                      className="text-xs text-cyan-600 hover:text-cyan-700 mt-1">Done</button>
                  </div>
                )}
              </div>

              {/* Days */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Days (empty = every day)</span>
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map(day => {
                    const active = (slot.days || []).includes(day);
                    return (
                      <button key={day} type="button"
                        onClick={() => toggleDay(si, day)}
                        className={`px-1.5 py-0.5 text-[11px] font-medium rounded cursor-pointer transition-colors ${
                          active ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                        }`}>
                        {DAY_SHORT[day]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time ranges */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Times (empty = all day)</span>
                  <Button variant="ghost" size="sm" type="button" onClick={() => addTimeRange(si)}>+ Time</Button>
                </div>
                {(slot.timeRanges || []).map((tr, ti) => (
                  <div key={ti} className="flex items-center gap-1">
                    <input type="time" value={tr.startTime}
                      onChange={e => updateTimeRange(si, ti, 'startTime', e.target.value)}
                      className="w-24 px-1.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                    <span className="text-slate-400 text-xs">-</span>
                    <input type="time" value={tr.endTime}
                      onChange={e => updateTimeRange(si, ti, 'endTime', e.target.value)}
                      className="w-24 px-1.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                    <button type="button" onClick={() => removeTimeRange(si, ti)}
                      className="text-xs text-red-400 hover:text-red-600">&times;</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit">{mode === 'add' ? 'Add' : 'Save'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
