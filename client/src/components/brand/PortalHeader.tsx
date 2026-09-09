import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppearance } from '../../contexts/AppearanceContext';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';

export default function PortalHeader({ workspace = false }: { workspace?: boolean }) {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { mode, toggleMode } = useAppearance();
  return <header className="portal-header"><div className="portal-header-inner">
    <Link to="/" className="portal-brand"><img src="/e-era-logo.png" alt="E时代" width="38" height="38"/><span>E时代信任中心<small>TRUST CENTER</small></span></Link>
    <nav aria-label="主要导航" className="portal-nav">{workspace ? <>
      <NavLink to="/dashboard">我的工作台</NavLink><NavLink to="/schemes">认证方案</NavLink><NavLink to="/status">申请记录</NavLink>
    </> : <><a href="#how-it-works">如何认证</a><a href="#connected">EID 联动</a></>}</nav>
    <div className="portal-actions"><button className="theme-toggle" onClick={toggleMode} aria-label={mode === 'light' ? '切换深色主题' : '切换浅色主题'}>{mode === 'light' ? <DarkModeOutlined/> : <LightModeOutlined/>}</button>
      {isAdmin && <Link className="portal-quiet" to="/admin">管理中心</Link>}
      {workspace ? <><span className="portal-user">{user?.username}</span><button className="portal-quiet" onClick={logout}>退出</button></> : <Link className="portal-button" to={isAuthenticated ? '/dashboard' : '/login'}>{isAuthenticated ? '我的工作台' : '登录 / 开始使用'} <span aria-hidden="true">↗</span></Link>}
    </div></div></header>;
}
