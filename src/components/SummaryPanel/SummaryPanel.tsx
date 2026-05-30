import { useRoster } from '../../context/RosterContext';
import { getWeeklySummaries } from '../../logic/hourCalculator';
import { getShiftsForWeek } from '../../logic/rosterUtils';

function hoursColor(hours: number): string {
  if (hours >= 48) return 'text-red-400 font-bold';
  if (hours >= 40) return 'text-amber-400 font-semibold';
  if (hours >= 20) return 'text-emerald-400';
  return 'text-slate-400';
}

export function SummaryPanel() {
  const { state } = useRoster();
  const weekShifts = getShiftsForWeek(state.shifts, state.weekStartDate);
  const summaries = getWeeklySummaries(state.employees, weekShifts);

  if (state.employees.length === 0) return null;

  const totalHours = summaries.reduce((sum, s) => sum + s.totalHours, 0);
  const totalShifts = summaries.reduce((sum, s) => sum + s.shiftCount, 0);

  return (
    <div className="bg-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Weekly Summary
        </h2>

        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Employee</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Roles</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Shifts</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {summaries.map(s => (
                <tr key={s.employeeId} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-slate-200">{s.employeeName}</td>
                  <td className="px-4 py-2.5 text-slate-400">{s.roleNames}</td>
                  <td className="px-4 py-2.5 text-center text-slate-400">{s.shiftCount}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${hoursColor(s.totalHours)}`}>
                    {s.totalHours}h
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-700/50 font-semibold">
                <td className="px-4 py-2.5 text-slate-200">Total</td>
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5 text-center text-slate-200">{totalShifts}</td>
                <td className="px-4 py-2.5 text-right text-slate-200 tabular-nums">
                  {Math.round(totalHours * 10) / 10}h
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
