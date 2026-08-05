"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Production-grade React error boundary. Catches rendering errors in the
 * component tree, logs them, and surfaces a recoverable fallback UI with a
 * reset action so the user can retry without a full page reload.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught render error", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Card className="mx-auto max-w-lg p-8 text-center">
          <div className="text-danger mb-4 text-4xl">⚠</div>
          <h2 className="font-display text-xl font-semibold">Something went wrong</h2>
          <p className="text-foreground-muted mt-2 text-sm">
            An unexpected error occurred while rendering this section. You can try again below.
          </p>
          {this.state.error && (
            <p className="text-foreground-faint mt-3 font-mono text-xs break-words">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload page
            </Button>
            <Button onClick={this.handleReset}>Try again</Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
