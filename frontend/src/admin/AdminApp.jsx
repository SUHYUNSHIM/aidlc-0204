import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useAdminContext } from './contexts/AdminContext';
import AdminLogin from './components/AdminLogin';
import OrderDashboard from './components/OrderDashboard';
import MenuManagement from './components/MenuManagement';
import TableManagement from './components/TableManagement';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminContext();
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

export default function AdminApp() {
  const { isAuthenticated, logout } = useAdminContext();
  
  return (
    <>
      {isAuthenticated && (
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              관리자 시스템
            </Typography>
            <Button color="inherit" component={Link} to="/admin/dashboard">대시보드</Button>
            <Button color="inherit" component={Link} to="/admin/menus">메뉴 관리</Button>
            <Button color="inherit" component={Link} to="/admin/tables">테이블 관리</Button>
            <Button color="inherit" onClick={logout}>로그아웃</Button>
          </Toolbar>
        </AppBar>
      )}
      
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <OrderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menus"
          element={
            <ProtectedRoute>
              <MenuManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <ProtectedRoute>
              <TableManagement />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </>
  );
}
