import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import MOEApp from './MOEApp.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MOEApp />
    <Toaster
      position="top-center"
      offset={16}
      toastOptions={{
        classNames: {
          toast: '!bg-surface !border !border-border !text-fg !shadow-elev !rounded-xl !font-sans',
          description: '!text-fg-muted',
          success: '!border-emerald-500/30',
          error: '!border-red-500/30',
          warning: '!border-amber-500/30'
        }
      }}
    />
  </React.StrictMode>
);
