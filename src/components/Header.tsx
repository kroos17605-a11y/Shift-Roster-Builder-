import { useState, useEffect } from 'react';
import { useRoster } from '../context/RosterContext';
import { getWeekDateRange, getShiftsForWeek, formatDate } from '../logic/rosterUtils';
import { listTeams, loadTeam, deleteTeamFile, saveTeam } from '../data/teamApi';
import { CopyWeekModal } from './CopyWeekModal';
import { ExportModal } from './ExportModal';
import { ClearRangeModal } from './ClearRangeModal';
import { HelpModal } from './HelpModal';
import { Button } from './ui/button';

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { state, dispatch } = useRoster();
  const [showCopy, setShowCopy] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const weekDays = getWeekDateRange(state.weekStartDate);
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];

  // Refresh team list from server on mount; auto-load demo if no teams exist
  useEffect(() => {
    listTeams().then(teamList => {
      dispatch({ type: 'SET_TEAMLIST', payload: { teamList } });
      if (teamList.length === 0) {
        dispatch({ type: 'LOAD_DEMO' });
      }
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
    // If loading Demo without saved data, fall back to fresh demo
    if (teamName === 'Demo' && data.employees.length === 0) {
      dispatch({ type: 'LOAD_DEMO' });
      return;
    }
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

  const handleManualSave = async () => {
    if (!state.teamName) return;
    setSaveStatus('saving');
    try {
      await saveTeam(state.teamName, state.employees, state.shifts);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        {/* Hamburger for mobile */}
        <button onClick={onToggleSidebar} className="lg:hidden p-1 text-slate-500 hover:text-slate-700 mr-1 cursor-pointer">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-base lg:text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap">Roster</h1>

          <select
            onChange={e => {
              const val = e.target.value;
              if (val === '__new__') {
                const name = window.prompt('New team name:');
                if (name?.trim()) {
                  handleSwitchTeam(name.trim());
                }
              } else if (val === '__demo__') {
                dispatch({ type: 'LOAD_DEMO' });
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
            <option value="__demo__">⭐ Demo</option>
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
          <button onClick={() => setShowHelp(true)}
            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer ml-1 border border-slate-200 rounded px-1.5 py-0.5"
            title="Help">?</button>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          {state.teamName && (
            <Button variant="ghost" size="sm" onClick={handleManualSave}
              disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? '...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}
            </Button>
          )}
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
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  );
}
