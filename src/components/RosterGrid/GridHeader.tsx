import { useRoster } from '../../context/RosterContext';
import { getWeekDateRange, isToday } from '../../logic/rosterUtils';

export function GridHeader() {
  const { state } = useRoster();
  const weekDays = getWeekDateRange(state.weekStartDate);

  return (
    <>
      {/* Empty corner cell */}
      <div className="sticky left-0 z-10 bg-slate-100 border-r border-b border-slate-300 px-3 py-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employees</span>
      </div>
      {weekDays.map((day, i) => {
        const today = isToday(state.weekStartDate, i);
        return (
          <div
            key={day.date}
            className={`text-center px-2 py-2 border-r border-b border-slate-300 ${
              today ? 'bg-cyan-50' : 'bg-slate-100'
            }`}
          >
            <div className={`text-xs font-semibold uppercase tracking-wide ${today ? 'text-cyan-700' : 'text-slate-600'}`}>
              {day.label.split('\n')[0]}
            </div>
            <div className={`text-xs ${today ? 'text-cyan-500 font-bold' : 'text-slate-400'}`}>
              {day.label.split('\n')[1]}
            </div>
          </div>
        );
      })}
    </>
  );
}
