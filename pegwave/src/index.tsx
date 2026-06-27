/**
 * Application bootstrap.
 *
 * Mount order: index.html → index.tsx → ui/App.tsx
 * Legacy poker scaffold lives in legacy/ and is not loaded at startup.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
