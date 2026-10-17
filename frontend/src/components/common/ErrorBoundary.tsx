import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
          <div className="max-w-md w-full rounded-2xl border border-red-500/40 bg-slate-900/95 p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black">Something went wrong</h2>
            <p className="text-xs text-slate-300">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Platform
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
