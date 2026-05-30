import { RosterProvider, useRoster } from './context/RosterContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { ConflictBanner } from './components/ConflictBanner';
import { EmployeeList } from './components/EmployeeManager/EmployeeList';
import { WeeklyGrid } from './components/RosterGrid/WeeklyGrid';
import { SummaryPanel } from './components/SummaryPanel/SummaryPanel';

function AppContent() {
  const { state } = useRoster();

  return (
    <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
      <Header />
      <ConflictBanner />

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
          <div className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-3 overflow-y-auto max-h-40 lg:max-h-none">
            <EmployeeList />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <WeeklyGrid />
          </div>
        </div>
      </div>

      <SummaryPanel />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <RosterProvider>
        <AppContent />
      </RosterProvider>
    </ErrorBoundary>
  );
}

export default App;
