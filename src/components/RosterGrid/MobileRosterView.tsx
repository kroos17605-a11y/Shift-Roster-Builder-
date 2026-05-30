import { useState } from 'react';
import { useRoster } from '../../context/RosterContext';
import { detectAllConflicts } from '../../logic/conflictDetector';
import { getShiftsForWeek, getWeekDateRange, isToday } from '../../logic/rosterUtils';
import { DAYS_OF_WEEK, type DayOfWeek } from '../../types';
import { Badge } from '../ui/badge';
import { ShiftBadge } from './ShiftBadge';
import { ShiftFormModal } from './ShiftFormModal';
import type { Shift } from '../../types';

const roleVariantMap: Record<string, 'cyan' | 'green' | 'purple' | 'yellow' | 'red' | 'default'> = {
  Cashier: 'cyan', Cook: 'green', Supervisor: 'purple', Dishwasher: 'yellow', Manager: 'red',
};

const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

export function MobileRosterView() {
  const { state, dispatch } = useRoster();
  const weekDays = getWeekDateRange(state.weekStartDate);
  const today = new Date().toISOString().slice(0, 10);
  const activeDayIdx = weekDays.findIndex(wd => wd.date === today);
  const [selectedIdx, setSelectedIdx] = useState(activeDayIdx >= 0 ? activeDayIdx : 0);
  const [isAdding, setIsAdding] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | undefined>();
  const [defaultEmpId, setDefaultEmpId] = useState('');

  const weekShifts = getShiftsForWeek(state.shifts, state.weekStartDate);
  const conflicts = detectAllConflicts(state.shifts, state.employees);
  const conflictIds = new Set(conflicts.flatMap(c => c.involvedShiftIds));

  const selectedDay = weekDays[selectedIdx];
  const dayShifts = weekShifts.filter(s => s.date === selectedDay?.date);

  const goPrevDay = () => setSelectedIdx(i => (i > 0 ? i - 1 : 6));
  const goNextDay = () => setSelectedIdx(i => (i < 6 ? i + 1 : 0));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Day tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
        <button onClick={goPrevDay} className="px-2 text-slate-400 hover:text-slate-600 shrink-0">
          ◀
        </button>
        <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {weekDays.map((wd, i) => {
            const isActive = i === selectedIdx;
            const isTodayCell = wd.date === today;
            return (
              <button
                key={wd.date}
                onClick={() => setSelectedIdx(i)}
                className={`flex-shrink-0 px-3 py-2 text-center text-xs snap-start min-w-[56px] border-b-2 transition-colors ${
                  isActive ? 'border-cyan-500 text-cyan-700 font-semibold bg-white' : 'border-transparent text-slate-500'
                } ${isTodayCell && !isActive ? 'text-cyan-600' : ''}`}
              >
                <div>{DAY_SHORT[wd.dayOfWeek]}</div>
                <div className={isTodayCell && !isActive ? 'font-bold' : ''}>{wd.date.slice(5)}</div>
              </button>
            );
          })}
        </div>
        <button onClick={goNextDay} className="px-2 text-slate-400 hover:text-slate-600 shrink-0">
          ▶
        </button>
      </div>

      {/* Day roster list */}
      <div className="flex-1 overflow-y-auto">
        {state.employees.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">No employees yet</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {state.employees.map(emp => {
              const empShifts = dayShifts.filter(s => s.employeeId === emp.id);
              return (
                <div key={emp.id} className="flex items-start px-3 py-2.5 gap-3">
                  <div className="w-20 shrink-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {emp.roles.map((r, i) => (
                        <Badge key={i} variant={roleVariantMap[r] || 'default'} className="text-[10px]">{r}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    {empShifts.map(s => (
                      <ShiftBadge
                        key={s.id}
                        id={s.id}
                        startTime={s.startTime}
                        endTime={s.endTime}
                        hasConflict={conflictIds.has(s.id)}
                        onClick={() => setEditingShift(s)}
                      />
                    ))}
                    <button
                      onClick={() => { setDefaultEmpId(emp.id); setIsAdding(true); }}
                      className="text-xs text-cyan-500 hover:text-cyan-600 text-left py-1 cursor-pointer"
                    >
                      + Add shift
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ShiftFormModal mode="add" isOpen={isAdding} onClose={() => setIsAdding(false)}
        defaultEmployeeId={defaultEmpId} defaultDay={selectedDay?.dayOfWeek} />
      <ShiftFormModal mode="edit" isOpen={!!editingShift} onClose={() => setEditingShift(undefined)} shift={editingShift} />
    </div>
  );
}
