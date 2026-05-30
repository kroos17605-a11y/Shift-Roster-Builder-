import { useState } from 'react';
import { useRoster } from '../../context/RosterContext';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeFormModal } from './EmployeeFormModal';
import { Button } from '../ui/button';

export function EmployeeList() {
  const { state } = useRoster();
  const [isAdding, setIsAdding] = useState(false);
  const existingRoles = [...new Set(state.employees.map(e => e.role).filter(Boolean))];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Employees</h2>
        <Button variant="primary" size="sm" onClick={() => setIsAdding(true)}>
          + Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {state.employees.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8 px-2">
            No employees yet.<br />Add your first employee.
          </p>
        ) : (
          state.employees.map(emp => (
            <EmployeeCard key={emp.id} employee={emp} existingRoles={existingRoles} />
          ))
        )}
      </div>

      <EmployeeFormModal
        mode="add"
        existingRoles={existingRoles}
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
      />
    </div>
  );
}
