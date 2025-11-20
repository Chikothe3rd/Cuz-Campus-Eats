import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Route failed to render", { error, info });
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              {this.props.fallbackTitle ?? "Something went wrong"}
            </p>
            <h2 className="text-2xl font-semibold mt-2">Please try again</h2>
            {this.state.message && (
              <p className="mt-2 text-muted-foreground text-sm">{this.state.message}</p>
            )}
          </div>
          <Button onClick={this.handleRetry}>Reload Section</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
