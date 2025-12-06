import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { RealtimeProvider } from './src/contexts/RealtimeContext';
import { WalletProvider } from './src/contexts/WalletContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <RealtimeProvider>
          <WalletProvider>
            <App />
          </WalletProvider>
        </RealtimeProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);