import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './lib/toast';
import { RealtimeProvider } from './src/contexts/RealtimeContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { HelmetProvider } from 'react-helmet-async';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ToastProvider>
        <AuthProvider>
          <RealtimeProvider>
            <WalletProvider>
              <App />
            </WalletProvider>
          </RealtimeProvider>
        </AuthProvider>
      </ToastProvider>
    </HelmetProvider>
  </React.StrictMode>
);