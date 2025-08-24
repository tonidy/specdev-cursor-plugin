import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

declare global {
  interface Window {
    acquireVsCodeApi?: () => { postMessage: (message: any) => void };
    vscode?: { postMessage: (message: any) => void };
  }
}

// Initialize VS Code API if available
if (typeof window.acquireVsCodeApi === 'function') {
  window.vscode = window.acquireVsCodeApi();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
