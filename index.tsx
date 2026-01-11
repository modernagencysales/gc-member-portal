import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { initSentry } from './lib/sentry';
import { queryClient } from './lib/queryClient';
import { initWebVitals } from './lib/webVitals';
import App from './App';

// Initialize Sentry for error tracking
initSentry();

// Initialize Web Vitals for performance monitoring
initWebVitals();

// Enable MSW in development (optional - uncomment to mock API)
// async function enableMocking() {
//   if (import.meta.env.DEV) {
//     const { worker } = await import('./mocks/browser');
//     return worker.start({ onUnhandledRequest: 'bypass' });
//   }
// }

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

// Render the app (add enableMocking().then() wrapper if using MSW)
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
