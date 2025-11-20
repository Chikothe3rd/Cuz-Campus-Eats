import React from 'react';

interface ErrorBoundaryState { hasError: boolean; error?: Error; }

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: integrate external monitoring (Sentry, LogRocket, etc.)
    console.error('Runtime error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            An unexpected error occurred. Please refresh the page. If the problem persists, contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
