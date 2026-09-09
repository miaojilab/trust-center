import React, { useState, ReactNode, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  CssBaseline,
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Avatar,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  VerifiedUser as VerifiedUserIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// 定义props类型
interface MainLayoutProps {
  children: ReactNode;
}

const drawerWidth = 240;

// 样式定义
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && !theme.breakpoints.down('md') && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// 移动端抽屉样式
const MobileDrawerStyle = {
  display: { xs: 'block', md: 'none' },
  '& .MuiDrawer-paper': {
    boxSizing: 'border-box',
    width: drawerWidth,
  },
};

// 桌面端抽屉样式，基于开关状态的变化
const DesktopDrawerStyle = (open: boolean, theme: any) => ({
  display: { xs: 'none', md: 'block' },
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    boxSizing: 'border-box',
    ...(open ? {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    } : {
      overflowX: 'hidden',
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    }),
  },
});

// 抽屉内容组件
interface DrawerContentProps {
  toggleDrawer: () => void;
  handleNavigation: (path: string) => void;
  handleLogout: () => void;
  isAdmin?: boolean;
}

const DrawerContent: React.FC<DrawerContentProps> = ({ 
  toggleDrawer, 
  handleNavigation, 
  handleLogout, 
  isAdmin 
}) => {
  return (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
        }}
      >
        <IconButton onClick={toggleDrawer}>
          <MenuIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List component="nav">
        {/* 用户菜单 */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/')}>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="首页" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/schemes')}>
            <ListItemIcon>
              <VerifiedUserIcon />
            </ListItemIcon>
            <ListItemText primary="认证方案" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/status')}>
            <ListItemIcon>
              <AssignmentTurnedInIcon />
            </ListItemIcon>
            <ListItemText primary="认证状态" />
          </ListItemButton>
        </ListItem>
        
        {/* 管理员菜单 */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigation('/admin')}>
                <ListItemIcon>
                  <AdminIcon />
                </ListItemIcon>
                <ListItemText primary="管理控制台" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigation('/admin/pending')}>
                <ListItemIcon>
                  <AssignmentTurnedInIcon />
                </ListItemIcon>
                <ListItemText primary="待审核列表" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigation('/admin/schemes')}>
                <ListItemIcon>
                  <VerifiedUserIcon />
                </ListItemIcon>
                <ListItemText primary="认证方案管理" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigation('/admin/query')}>
                <ListItemIcon>
                  <SearchIcon />
                </ListItemIcon>
                <ListItemText primary="认证查询" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigation('/admin/api-docs')}>
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText primary="接口文档" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        
        {/* 登出按钮 */}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="退出登录" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  // 监听窗口大小变化，在手机端自动收起侧栏
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleNavigation = (path: string) => {
    if (path === location.pathname) return;
    setLoadingPath(path);
    requestAnimationFrame(() => requestAnimationFrame(() => navigate(path)));
  };

  useEffect(() => {
    setLoadingPath(null);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {loadingPath && <Box className="trust-loading-bar" role="status" aria-live="polite" aria-label="正在加载页面"><span /></Box>}
      <AppBar position="absolute" open={open}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '12px',
            }}
          >
            <MenuIcon />
          </IconButton>
          <SecurityIcon sx={{ display: 'flex', mr: 1 }} />
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            E时代信任中心
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user?.username || '用户'}
            </Typography>
            <Avatar src={user?.avatar} alt={user?.username}>
              {user?.username?.[0] || 'U'}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* 移动端抽屉 */}
      <MuiDrawer
        variant="temporary"
        open={isMobile ? open : false}
        onClose={toggleDrawer}
        ModalProps={{
          keepMounted: true,
        }}
        sx={MobileDrawerStyle}
      >
        <DrawerContent 
          toggleDrawer={toggleDrawer}
          handleNavigation={handleNavigation}
          handleLogout={handleLogout}
          isAdmin={isAdmin}
        />
      </MuiDrawer>
      
      {/* 桌面端抽屉 */}
      <MuiDrawer
        variant="permanent"
        open={!isMobile ? open : false}
        sx={DesktopDrawerStyle(open, theme)}
      >
        <DrawerContent 
          toggleDrawer={toggleDrawer}
          handleNavigation={handleNavigation}
          handleLogout={handleLogout}
          isAdmin={isAdmin}
        />
      </MuiDrawer>
      
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          zIndex: 1,
          position: 'relative',
        }}
      >
        <Toolbar />
        <Box sx={{ 
          p: {
            xs: 1.5,
            sm: 2,
            md: 3
          },
          mt: isMobile ? 1 : 0
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout; 