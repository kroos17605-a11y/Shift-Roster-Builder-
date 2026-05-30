import { useState } from 'react';
import type { Employee } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useRoster } from '../../context/RosterContext';
import { EmployeeFormModal } from './EmployeeFormModal';

interface Props {
  employee: Employee;
  existingRoles: string[];
}

const roleVariantMap: Record<string, 'cyan' | 'green' | 'purple' | 'yellow' | 'red' | 'default'> = {
  Cashier: 'cyan',
  Cook: 'green',
  Supervisor: 'purple',
  Dishwasher: 'yellow',
  Manager: 'red',
};

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

const DAY_FULL: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

function describeSlot(s: Employee['unavailableSlots'][0]): string {
  const parts: string[] = [];
  // Date range
  if (s.dateFrom && s.dateTo) parts.push(`${s.dateFrom} → ${s.dateTo}`);
  else if (s.dateFrom) parts.push(`From ${s.dateFrom}`);
  else if (s.dateTo) parts.push(`Until ${s.dateTo}`);
  else parts.push('Always');

  // Days
  if (s.days && s.days.length > 0) parts.push(s.days.map(d => DAY_FULL[d]).join(','));
  else parts.push('Every day');

  // Times
  if (s.timeRanges && s.timeRanges.length > 0) {
    parts.push(s.timeRanges.map(tr => `${tr.startTime}-${tr.endTime}`).join(', '));
  } else {
    parts.push('All day');
  }
  return parts.join(' · ');
}

export function EmployeeCard({ employee, existingRoles }: Props) {
  const { dispatch } = useRoster();
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    if (window.confirm(`Remove ${employee.name} and all their shifts?`)) {
      dispatch({ type: 'REMOVE_EMPLOYEE', payload: { id: employee.id } });
    }
  };

  const hasUnavailable = employee.unavailableSlots && employee.unavailableSlots.length > 0;

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-default overflow-hidden">
        {/* Main row */}
        <div
          className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-800 truncate">{employee.name}</p>
              {hasUnavailable && (
                <span className="text-[10px] text-red-400" title="Has unavailability">&#9632;</span>
              )}
              <span className={`text-[10px] text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`}>
                &#9654;
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant={roleVariantMap[employee.role] || 'default'}>{employee.role}</Badge>
            </div>
          </div>

          {isHovered && (
            <div className="flex items-center gap-1 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-11 11L2 18l.586-3.414 11-11z" />
                </svg>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" />
                </svg>
              </Button>
            </div>
          )}
        </div>

        {/* Expandable unavailability details */}
        {expanded && hasUnavailable && (
          <div className="px-3 pb-2.5 pt-1 border-t border-slate-100">
            <p className="text-[10px] font-medium text-slate-400 uppercase mb-1.5">Unavailable</p>
            <div className="space-y-1">
              {employee.unavailableSlots.map((slot, i) => (
                <div key={i} className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
                  {describeSlot(slot)}
                </div>
              ))}
            </div>
          </div>
        )}

        {expanded && !hasUnavailable && (
          <div className="px-3 pb-2.5 pt-1 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 italic">Always available</p>
          </div>
        )}
      </div>

      <EmployeeFormModal
        mode="edit"
        employee={employee}
        existingRoles={existingRoles}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </>
  );
}
