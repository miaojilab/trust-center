import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Stack, CircularProgress, Divider, Card, CardContent, CardActionArea, Grid } from '@mui/material';
import { PeopleOutline as UsersIcon, DescriptionOutlined as SchemeIcon, AssignmentOutlined as SubmissionIcon, CheckCircleOutline as ApprovedIcon, ErrorOutline as RejectedIcon, HourglassEmpty as PendingIcon, PendingActions as PendingActionsIcon, VerifiedUser as VerifiedIcon, Search as SearchIcon } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import MainLayout from '../../components/layout/MainLayout';

interface DashboardStat {
  userCount: number;
  schemeCount: number;
  submissionStats: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'primary.main' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          mr: 2, 
          display: 'flex', 
          p: 1, 
          borderRadius: 1,
          backgroundColor: `${color}15`,
          color: color
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStat | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getDashboardStats();
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          // 初始化默认数据
          setStats({
            userCount: 0,
            schemeCount: 0,
            submissionStats: {
              total: 0,
              pending: 0,
              approved: 0,
              rejected: 0
            }
          });
          console.log('无法获取统计数据，使用默认值');
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 初始化默认数据
        setStats({
          userCount: 0,
          schemeCount: 0,
          submissionStats: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // 导航到待审核页面
  const handleViewPending = () => {
    navigate('/admin/pending');
  };

  // 管理认证方案
  const handleManageSchemes = () => {
    navigate('/admin/schemes');
  };

  
  // 认证查询
  const handleQueryVerifications = () => {
    navigate('/admin/query');
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          管理员控制台
        </Typography>
        <Typography variant="body1" color="text.secondary">
          在这里可以管理所有身份认证申请和认证方案。
        </Typography>
      </Box>

      <Stack spacing={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>系统概览</Typography>
          <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap">
            <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 30%' } }}>
              <StatCard
                title="用户数量"
                value={stats?.userCount || 0}
                icon={<UsersIcon />}
                color="primary.main"
              />
            </Box>
            <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 30%' } }}>
              <StatCard
                title="认证方案"
                value={stats?.schemeCount || 0}
                icon={<SchemeIcon />}
                color="info.main"
              />
            </Box>
            <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 30%' } }}>
              <StatCard
                title="提交总数"
                value={stats?.submissionStats.total || 0}
                icon={<SubmissionIcon />}
                color="secondary.main"
              />
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>认证状态</Typography>
          <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap">
            <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 30%' } }}>
              <StatCard
                title="已批准"
                value={stats?.submissionStats.approved || 0}
                icon={<ApprovedIcon />}
                color="success.main"
              />
            </Box>
            <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 30%' } }}>
              <StatCard
                title="待审核"
                value={stats?.submissionStats.pending || 0}
                icon={<PendingIcon />}
                color="warning.main"
              />
            </Box>
            <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 30%' } }}>
              <StatCard
                title="已拒绝"
                value={stats?.submissionStats.rejected || 0}
                icon={<RejectedIcon />}
                color="error.main"
              />
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <Typography variant="h5" gutterBottom>
        快速操作
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea
              sx={{ height: '100%', p: 2 }}
              onClick={handleViewPending}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <PendingActionsIcon color="warning" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" align="center">
                  待审核申请
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  查看并处理待审核的KYC申请
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea
              sx={{ height: '100%', p: 2 }}
              onClick={handleManageSchemes}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VerifiedIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" align="center">
                  认证方案管理
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  创建、编辑和管理KYC认证方案
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea
              sx={{ height: '100%', p: 2 }}
              onClick={handleQueryVerifications}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <SearchIcon color="info" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" align="center">
                  认证查询
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  查询用户认证情况和认证方案状态
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default AdminDashboard; 