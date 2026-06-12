import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface PrivateRouteProps {
  requireAdmin?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // 加载中显示加载动画
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 需要管理员权限但不是管理员，重定向到首页
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 认证通过，渲染子路由
  return <Outlet />;
};

export default PrivateRoute; 