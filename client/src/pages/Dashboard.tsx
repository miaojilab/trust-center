import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Stack,
  Paper,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  PersonOutline as PersonIcon,
  CheckCircleOutline as VerifiedIcon,
  PendingOutlined as PendingIcon,
  InfoOutlined as InfoIcon,
  EditOutlined as EditIcon,
  AddOutlined as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { kycAPI } from '../services/api';
import { KYCScheme, KYCSubmission } from '../types';
import MainLayout from '../components/layout/MainLayout';

// 状态颜色映射
const statusColors: Record<string, "success" | "warning" | "error" | "default"> = {
  approved: "success",
  pending: "warning",
  rejected: "error"
};

// 状态标签映射
const statusLabels: Record<string, string> = {
  approved: "已认证",
  pending: "待审核",
  rejected: "未通过"
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState<KYCScheme[]>([]);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 使用组合接口一次性获取所有数据，避免并发请求竞争
        const response = await kycAPI.getInitialData();

        if (response.success && response.data) {
          // 设置方案列表
          setSchemes(response.data.schemes);
          
          // 设置用户提交状态
          const submissionsData = response.data.userStatus.map(sub => ({
            ...sub,
            schemeId: sub.KYCScheme?.id || sub.schemeId
          }));
          setSubmissions(submissionsData);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // 查找认证状态
  const getSubmissionStatus = (schemeId: number) => {
    const submission = submissions.find(s => s.schemeId === schemeId);
    return submission ? submission.status : null;
  };

  // 查看方案详情
  const handleViewScheme = (schemeId: number) => {
    navigate(`/schemes/${schemeId}`);
  };

  // 开始身份认证
  const handleStartKYC = (schemeId: number) => {
    navigate(`/submit/${schemeId}`);
  };

  // 查看认证状态
  const handleViewStatus = () => {
    navigate('/status');
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
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          欢迎, {user?.username || '用户'} !
        </Typography>
        <Typography variant="body1">
          欢迎使用E时代信任中心。您可以在这里管理您的身份认证信息。
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon sx={{ mr: 1 }} />
          <Typography variant="h6">个人信息</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
          <Box sx={{ minWidth: '200px', flex: 1 }}>
            <Typography variant="body2" color="text.secondary">用户名</Typography>
            <Typography variant="body1">{user?.username || '未设置'}</Typography>
          </Box>
          <Box sx={{ minWidth: '200px', flex: 1 }}>
            <Typography variant="body2" color="text.secondary">邮箱</Typography>
            <Typography variant="body1">{user?.email || '未设置'}</Typography>
          </Box>
          <Box sx={{ minWidth: '200px', flex: 1 }}>
            <Typography variant="body2" color="text.secondary">注册时间</Typography>
            <Typography variant="body1">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>认证方案</Typography>
      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
        {schemes.map((scheme) => {
          const status = getSubmissionStatus(scheme.id);
          return (
            <Card key={scheme.id} sx={{ minWidth: 300, flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 30%' } }}>
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {scheme.name}
                  </Typography>
                  {status && (
                    <Chip
                      label={statusLabels[status]}
                      color={statusColors[status]}
                      size="small"
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {scheme.description || '无描述'}
                </Typography>
                {status && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      状态: <strong>{statusLabels[status]}</strong>
                    </Typography>
                    {status === 'approved' && (
                      <Typography variant="body2" color="success.main">
                        您已完成此认证方案
                      </Typography>
                    )}
                    {status === 'pending' && (
                      <Typography variant="body2" color="warning.main">
                        您的认证申请正在审核中
                      </Typography>
                    )}
                    {status === 'rejected' && (
                      <Typography variant="body2" color="error.main">
                        您的认证申请未通过，请重新提交
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => handleViewScheme(scheme.id)}
                  startIcon={<InfoIcon />}
                >
                  详细信息
                </Button>
                {status === 'approved' ? (
                  <Button
                    size="small"
                    color="success"
                    startIcon={<VerifiedIcon />}
                    onClick={() => handleViewScheme(scheme.id)}
                  >
                    查看认证
                  </Button>
                ) : status === 'pending' ? (
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<PendingIcon />}
                    onClick={handleViewStatus}
                  >
                    查看进度
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleStartKYC(scheme.id)}
                    startIcon={status === 'rejected' ? <EditIcon /> : <AddIcon />}
                  >
                    {status === 'rejected' ? '重新认证' : '开始认证'}
                  </Button>
                )}
              </CardActions>
            </Card>
          );
        })}
        {schemes.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center', width: '100%' }}>
            <Typography variant="body1">暂无可用的认证方案</Typography>
          </Paper>
        )}
      </Stack>
    </MainLayout>
  );
};

export default Dashboard; 