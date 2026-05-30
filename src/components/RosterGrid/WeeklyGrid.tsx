import { useRoster } from '../../context/RosterContext';
import { detectAllConflicts } from '../../logic/conflictDetector';
import { getShiftsForWeek, getDateFromDay } from '../../logic/rosterUtils';
import { DAYS_OF_WEEK } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { GridHeader } from './GridHeader';
import { ShiftCell } from './ShiftCell';
import { useState, useMemo } from 'react';
import { EmployeeFormModal } from '../EmployeeManager/EmployeeFormModal';
import { DndContext, PointerSensor, useSensor, useSensors, pointerWithin, type DragEndEvent } from '@dnd-kit/core';

const roleVariantMap: Record<string, 'cyan' | 'green' | 'purple' | 'yellow' | 'red' | 'default'> = {
  Cashier: 'cyan',
  Cook: 'green',
  Supervisor: 'purple',
  Dishwasher: 'yellow',
  Manager: 'red',
};

export function WeeklyGrid() {
  const { state, dispatch } = useRoster();
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const weekShifts = getShiftsForWeek(state.shifts, state.weekStartDate);
  // Use ALL shifts for conflict detection so cross-week conflicts are visible in both weeks
  const conflicts = useMemo(() => detectAllConflicts(state.shifts, state.employees), [state.shifts, state.employees]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const shiftId = active.id as string;
    const targetId = over.id as string; // format: "employeeId:day"
    const [targetEmpId, targetDay] = targetId.split(':');

    const shift = state.shifts.find(s => s.id === shiftId);
    if (!shift) return;

    const newDate = getDateFromDay(state.weekStartDate, targetDay as typeof shift.day);

    dispatch({
      type: 'UPDATE_SHIFT',
      payload: {
        id: shiftId,
        employeeId: targetEmpId,
        day: targetDay as typeof shift.day,
        date: newDate,
      },
    });
  };

  if (state.employees.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-16">
          <div className="text-5xl mb-4 text-slate-300">&#128203;</div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No employees yet</h3>
          <p className="text-sm text-slate-400 mb-6">Add employees to start building the weekly roster.</p>
          <Button onClick={() => setIsAddingEmployee(true)}>Add First Employee</Button>
          <EmployeeFormModal mode="add" existingRoles={[]} isOpen={isAddingEmployee} onClose={() => setIsAddingEmployee(false)} />
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-auto">
        <div
          className="grid min-w-[900px]"
          style={{ gridTemplateColumns: '180px repeat(7, 1fr)' }}
        >
          <GridHeader />

          {state.employees.map((emp) => (
            <>
              {/* Employee name column */}
              <div
                key={`emp-${emp.id}`}
                className="sticky left-0 z-5 bg-white border-r border-b border-slate-200 px-3 py-2 flex flex-col justify-center"
              >
                <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  <Badge variant={roleVariantMap[emp.role] || 'default'} className="text-[10px]">{emp.role}</Badge>
                </div>
              </div>

              {/* 7 day cells per employee */}
              {DAYS_OF_WEEK.map(day => (
                <ShiftCell
                  key={`${emp.id}-${day}`}
                  employeeId={emp.id}
                  day={day}
                  conflicts={conflicts}
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
