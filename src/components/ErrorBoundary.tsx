import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: '' };

  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <p className="text-red-500 text-4xl mb-4">!</p>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 font-mono bg-slate-100 rounded p-2 mb-4">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 cursor-pointer"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
