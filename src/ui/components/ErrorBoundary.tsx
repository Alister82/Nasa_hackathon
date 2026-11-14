import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // No console.log in committed code per RULES.md section 8
    void error;
    void errorInfo;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-6 text-center max-w-md mx-auto my-12 bg-panel rounded-sheet border border-line">
          <h2 className="text-xl font-bold text-ink mb-2">Something went wrong on this screen.</h2>
          <p className="text-ink-soft text-sm mb-6">
            An unexpected error occurred while rendering this view.
          </p>
          <a
            href="#/"
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center justify-center px-4 py-2 bg-instrument text-panel font-medium rounded-input hover:opacity-90 min-h-[44px] min-w-[44px]"
          >
            Back to Today
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
