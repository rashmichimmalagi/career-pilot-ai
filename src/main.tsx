import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against benign ResizeObserver loop limit errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (
      e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      e.message === 'ResizeObserver loop limit exceeded' ||
      e.message?.includes('ResizeObserver')
    ) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    if (
      e.reason?.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      e.reason?.message === 'ResizeObserver loop limit exceeded' ||
      e.reason?.message?.includes('ResizeObserver')
    ) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

