import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import Homepage from "./pages/Homepage";
import Changelog from "./pages/Changelog";

import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import Commands from "./pages/Commands";
import Invite from "./pages/Invite";
import ServerSelection from "./pages/ServerSelection";
import Profile from "./pages/Profile";
import ControlPanel from "./pages/ControlPanel";
import Settings from "./pages/Settings";
import About from "./pages/About";
import { Component, ReactNode, useEffect } from "react";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">Please refresh the page</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handler component
function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Only prevent default for non-critical errors
      if (event.reason && typeof event.reason === 'object' && event.reason.name !== 'AbortError') {
        // Log more detailed error information for debugging
        if (event.reason.stack) {
          console.error('Stack trace:', event.reason.stack);
        }
      }
      
      // Don't prevent default to allow proper error reporting
    };

    // Handle other global errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
      
      // Don't prevent default to allow proper error reporting
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}

// Default fetcher function for React Query with better error handling
const defaultQueryFn = async ({ queryKey }: { queryKey: readonly string[] }) => {
  const url = queryKey[0];
  
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Handle different error types gracefully
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('Not found');
      }
      if (response.status >= 500) {
        throw new Error('Server error');
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Handle network errors and other exceptions
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network connection failed');
    }
    throw error;
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('40')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/features" component={Features} />
      <Route path="/commands" component={Commands} />
      <Route path="/invite" component={Invite} />
      <Route path="/changelog" component={Changelog} />
      <Route path="/about" component={About} />
      <Route path="/server-selection" component={ServerSelection} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/control-panel/:serverId" component={ControlPanel} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <GlobalErrorHandler />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="min-h-screen bg-discord-tertiary text-discord-normal">
            <Router />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;