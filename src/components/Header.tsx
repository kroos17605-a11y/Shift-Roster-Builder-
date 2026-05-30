import { useState, useEffect } from 'react';
import { useRoster } from '../context/RosterContext';
import { getWeekDateRange, getShiftsForWeek, formatDate } from '../logic/rosterUtils';
import { listTeams, loadTeam, deleteTeamFile } from '../data/teamApi';
import { CopyWeekModal } from './CopyWeekModal';
import { ExportModal } from './ExportModal';
import { ClearRangeModal } from './ClearRangeModal';
import { Button } from './ui/button';

export function Header() {
  const { state, dispatch } = useRoster();
  const [showCopy, setShowCopy] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showClear, setShowClear] = useState(false);

  const weekDays = getWeekDateRange(state.weekStartDate);
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];

  // Refresh team list from server on mount
  useEffect(() => {
    listTeams().then(teamList => {
      dispatch({ type: 'SET_TEAMLIST', payload: { teamList } });
    }).catch(() => {});
  }, []);

  const goPrevWeek = () => {
    const d = new Date(state.weekStartDate + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    dispatch({ type: 'SET_WEEK', payload: { weekStartDate: formatDate(d) } });
  };

  const goNextWeek = () => {
    const d = new Date(state.weekStartDate + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    dispatch({ type: 'SET_WEEK', payload: { weekStartDate: formatDate(d) } });
  };

  const goThisWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    today.setDate(today.getDate() + diff);
    dispatch({ type: 'SET_WEEK', payload: { weekStartDate: formatDate(today) } });
  };

  const handleSwitchTeam = async (teamName: string) => {
    const data = await loadTeam(teamName);
    const teamList = await listTeams();
    dispatch({ type: 'LOAD_TEAM', payload: { ...data, teamList } });
  };

  const handleDeleteTeam = async () => {
    if (!state.teamName) return;
    if (!window.confirm(`Delete team "${state.teamName}"? This removes the file from data/teams/.`)) return;
    await deleteTeamFile(state.teamName);
    const teamList = await listTeams();
    dispatch({ type: 'DELETE_TEAM_DONE', payload: { teamName: state.teamName } });
    dispatch({ type: 'SET_TEAMLIST', payload: { teamList } });
  };

  const weekShiftCount = getShiftsForWeek(state.shifts, state.weekStartDate).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap">Roster</h1>

          <select
            onChange={e => {
              const val = e.target.value;
              if (val === '__new__') {
                const name = window.prompt('New team name:');
                if (name?.trim()) {
                  handleSwitchTeam(name.trim());
                }
              } else if (val === '__refresh__') {
                listTeams().then(tl => dispatch({ type: 'SET_TEAMLIST', payload: { teamList: tl } }));
              } else if (val) {
                handleSwitchTeam(val);
              }
            }}
            value=""
            className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer max-w-[140px]"
          >
            <option value="" disabled>{state.teamName || 'Teams...'}</option>
            <option value="__new__">+ New Team</option>
            <option value="__refresh__">↻ Refresh list</option>
            <option disabled>---</option>
            {state.teamList.map(t => (
              <option key={t} value={t}>{t}{t === state.teamName ? ' ✓' : ''}</option>
            ))}
          </select>

          {state.teamName && (
            <button onClick={handleDeleteTeam}
              className="text-xs text-red-400 hover:text-red-600 cursor-pointer ml-1"
              title="Delete this team file from data/teams/">Del</button>
          )}
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          {state.shifts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowClear(true)}>Clear</Button>
          )}
          {weekShiftCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowCopy(true)}>Copy</Button>
          )}
          {state.employees.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowExport(true)}>Export</Button>
          )}

          <button onClick={goPrevWeek} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="Previous week">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5l-5 5 5 5" /></svg>
          </button>
          <button onClick={goThisWeek} className="text-sm font-medium text-slate-600 hover:text-slate-800 min-w-[140px] lg:min-w-[180px] text-center cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            {firstDay.label.replace('\n', ' ')} — {lastDay.label.replace('\n', ' ')}
          </button>
          <button onClick={goNextWeek} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="Next week">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 5l5 5-5 5" /></svg>
          </button>
        </div>
      </div>

      <CopyWeekModal isOpen={showCopy} onClose={() => setShowCopy(false)} />
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
      <ClearRangeModal isOpen={showClear} onClose={() => setShowClear(false)} />
    </header>
  );
}
