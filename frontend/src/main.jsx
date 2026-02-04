import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import { queryClient } from './config/queryClient';
import { AdminProvider } from './admin/contexts/AdminContext';
import AdminApp from './admin/AdminApp';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AdminProvider>
          <CssBaseline />
          <AdminApp />
        </AdminProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
