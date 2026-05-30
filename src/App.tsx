import { useState } from 'react';
import { RosterProvider, useRoster } from './context/RosterContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { ConflictBanner } from './components/ConflictBanner';
import { EmployeeList } from './components/EmployeeManager/EmployeeList';
import { WeeklyGrid } from './components/RosterGrid/WeeklyGrid';
import { MobileRosterView } from './components/RosterGrid/MobileRosterView';
import { SummaryPanel } from './components/SummaryPanel/SummaryPanel';

function AppContent() {
  const { state } = useRoster();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(o => !o)} />

      {/* Mobile sidebar drawer overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-500 uppercase">Employees</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-3">
              <EmployeeList />
            </div>
          </div>
        </div>
      )}

      <ConflictBanner />

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-56 shrink-0 border-r border-slate-200 bg-white p-3 overflow-y-auto">
            <EmployeeList />
          </div>

          {/* Desktop grid */}
          <div className="hidden lg:flex flex-1 flex-col overflow-hidden bg-white">
            <WeeklyGrid />
          </div>

          {/* Mobile roster view */}
          <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
            <MobileRosterView />
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
