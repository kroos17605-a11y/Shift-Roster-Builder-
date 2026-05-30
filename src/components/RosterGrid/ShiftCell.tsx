import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { DayOfWeek, Shift, Conflict } from '../../types';
import { getShiftsForDay, getShiftsForWeek } from '../../logic/rosterUtils';
import { useRoster } from '../../context/RosterContext';
import { ShiftBadge } from './ShiftBadge';
import { ShiftFormModal } from './ShiftFormModal';

interface Props {
  employeeId: string;
  day: DayOfWeek;
  conflicts: Conflict[];
}

export function ShiftCell({ employeeId, day, conflicts }: Props) {
  const { state } = useRoster();
  const [isAdding, setIsAdding] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | undefined>();
  const [isHovered, setIsHovered] = useState(false);

  const droppableId = `${employeeId}:${day}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const weekShifts = getShiftsForWeek(state.shifts, state.weekStartDate);
  const shifts = getShiftsForDay(weekShifts, employeeId, day);

  const conflictIds = new Set(conflicts.flatMap(c => c.involvedShiftIds));
  const highlightedIds = new Set(state.highlightedShiftIds);
  const hasShiftConflict = shifts.some(s => conflictIds.has(s.id));

  return (
    <>
      <div
        ref={setNodeRef}
        className={`relative min-h-[80px] p-1.5 border-r border-b border-slate-200 bg-white transition-colors ${
          hasShiftConflict ? 'bg-red-50 border-red-200' : ''
        } ${isOver ? 'bg-cyan-50 ring-2 ring-cyan-400 ring-inset' : ''} ${isHovered ? 'bg-slate-50' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col gap-1">
          {shifts.map(s => (
            <ShiftBadge
              key={s.id}
              id={s.id}
              startTime={s.startTime}
              endTime={s.endTime}
              hasConflict={conflictIds.has(s.id)}
              isHighlighted={highlightedIds.has(s.id)}
              onClick={() => setEditingShift(s)}
            />
          ))}
        </div>

        {isHovered && (
          <button
            onClick={() => setIsAdding(true)}
            className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-sm leading-none hover:bg-cyan-600 transition-colors cursor-pointer shadow-sm"
            title="Add shift"
          >
            +
          </button>
        )}
      </div>

      <ShiftFormModal
        mode="add"
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        defaultEmployeeId={employeeId}
        defaultDay={day}
      />
      <ShiftFormModal
        mode="edit"
        isOpen={!!editingShift}
        onClose={() => setEditingShift(undefined)}
        shift={editingShift}
      />
    </>
  );
}
