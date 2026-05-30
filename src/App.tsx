import { RosterProvider, useRoster } from './context/RosterContext';
import { Header } from './components/Header';
import { ConflictBanner } from './components/ConflictBanner';
import { EmployeeList } from './components/EmployeeManager/EmployeeList';
import { WeeklyGrid } from './components/RosterGrid/WeeklyGrid';
import { SummaryPanel } from './components/SummaryPanel/SummaryPanel';
import { Button } from './components/ui/button';
import { sampleEmployees, sampleShifts } from './data/sampleData';
import { useState } from 'react';

function AppContent() {
  const { state, dispatch } = useRoster();
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const handleLoadSample = () => {
    dispatch({ type: 'LOAD_SAMPLE', payload: { employees: sampleEmployees, shifts: sampleShifts } });
    setSampleLoaded(true);
  };

  return (
    <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
      <Header />
      <ConflictBanner />

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {state.employees.length === 0 && !sampleLoaded ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-16 max-w-md">
              <div className="text-6xl mb-6 text-slate-300">&#128197;</div>
              <h2 className="text-2xl font-bold text-slate-700 mb-3">
                Shift Roster Builder
              </h2>
              <p className="text-slate-500 mb-2">
                Manage weekly staff schedules for your small team.
              </p>
              <ul className="text-sm text-slate-400 text-left space-y-1.5 mb-8 mx-auto max-w-xs">
                <li>&#10003; Add and manage employees</li>
                <li>&#10003; Assign shifts across a 7-day week</li>
                <li>&#10003; View schedule in a weekly grid</li>
                <li>&#10003; Detect scheduling conflicts automatically</li>
                <li>&#10003; See total hours per employee</li>
              </ul>
              <div className="flex gap-3 justify-center">
                <Button size="lg" onClick={handleLoadSample}>
                  Load Sample Data
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
            <div className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-3 overflow-y-auto max-h-48 lg:max-h-none">
              <EmployeeList />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <WeeklyGrid />
            </div>
          </div>
        )}
      </div>

      <SummaryPanel />
    </div>
  );
}

function App() {
  return (
    <RosterProvider>
      <AppContent />
    </RosterProvider>
  );
}

export default App;
