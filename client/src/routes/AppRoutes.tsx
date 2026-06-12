import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';

// 懒加载页面组件
const Login = lazy(() => import('../pages/Login'));
const OAuthCallback = lazy(() => import('../pages/OAuthCallback'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const SchemeList = lazy(() => import('../pages/SchemeList'));
const SchemeDetail = lazy(() => import('../pages/SchemeDetail'));
const SubmissionForm = lazy(() => import('../pages/SubmissionForm'));
const SubmissionStatus = lazy(() => import('../pages/SubmissionStatus'));
const SubmissionDetail = lazy(() => import('../pages/SubmissionDetail'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminPendingList = lazy(() => import('../pages/admin/AdminPendingList'));
const AdminReview = lazy(() => import('../pages/admin/AdminReview'));
const AdminSchemeCreate = lazy(() => import('../pages/admin/AdminSchemeCreate'));
const AdminSchemeList = lazy(() => import('../pages/admin/AdminSchemeList'));
const AdminSchemeDetail = lazy(() => import('../pages/admin/AdminSchemeDetail'));
const AdminSchemeEdit = lazy(() => import('../pages/admin/AdminSchemeEdit'));
const AdminQuery = lazy(() => import('../pages/admin/AdminQuery'));
const NotFound = lazy(() => import('../pages/NotFound'));
const ApiDocumentation = lazy(() => import('../pages/admin/ApiDocumentation'));

const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner fullScreen={true} />}>
        <Routes>
          {/* 公共路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          
          {/* 用户私有路由 */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schemes" element={<SchemeList />} />
            <Route path="/schemes/:id" element={<SchemeDetail />} />
            <Route path="/submit/:schemeId" element={<SubmissionForm />} />
            <Route path="/status" element={<SubmissionStatus />} />
            <Route path="/submission/:id" element={<SubmissionDetail />} />
          </Route>
          
          {/* 管理员路由 */}
          <Route element={<PrivateRoute requireAdmin={true} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/pending" element={<AdminPendingList />} />
            <Route path="/admin/review/:submissionId" element={<AdminReview />} />
            <Route path="/admin/schemes" element={<AdminSchemeList />} />
            <Route path="/admin/schemes/create" element={<AdminSchemeCreate />} />
            <Route path="/admin/schemes/:id" element={<AdminSchemeDetail />} />
            <Route path="/admin/schemes/edit/:id" element={<AdminSchemeEdit />} />
            <Route path="/admin/api-docs" element={<ApiDocumentation />} />
            <Route path="/admin/query" element={<AdminQuery />} />
          </Route>
          
          {/* 默认和错误路由 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes; 