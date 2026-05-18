'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-primary-text mb-2">Something went wrong</h2>
          <p className="text-secondary-text text-sm mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-xl font-bold text-sm hover:bg-emerald-400 transition-all"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-primary-text rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
            >
              <Home size={16} />
              Go Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-primary-text mb-2">Failed to load</h2>
          <p className="text-secondary-text text-sm mb-4">Please refresh the page or try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-xl font-bold text-sm hover:bg-emerald-400 transition-all"
          >
            <RefreshCw size={16} />
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}