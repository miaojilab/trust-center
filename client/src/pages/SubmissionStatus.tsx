import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Grid, Button, Divider, CircularProgress, Alert, Chip, Card, CardContent, CardActions, Stack } from '@mui/material';
import { CheckCircle as CheckIcon, Pending as PendingIcon, Home as HomeIcon, Refresh as RefreshIcon, Cancel as CancelIcon, Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import MainLayout from '../components/layout/MainLayout';
import { userAPI, kycAPI } from '../services/api';
import { KYCSubmission, KYCScheme } from '../types';

// 状态到图标的映射
const statusIcons: Record<string, React.ReactElement> = {
  pending: <PendingIcon />,
  approved: <CheckIcon />,
  rejected: <CancelIcon />,
};

// 状态颜色映射 - 修改为使用MUI支持的颜色
const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  default: 'default'
};


// 状态标签映射
const statusLabels: Record<string, string> = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
};

// 提交状态页面
const SubmissionStatus: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [schemes, setSchemes] = useState<KYCScheme[]>([]);

  // 获取用户所有提交记录
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行获取数据
      const [submissionsResponse, schemesResponse] = await Promise.all([
        userAPI.getUserSubmissions(),
        kycAPI.getAllSchemes()
      ]);
      
      if (submissionsResponse.success && submissionsResponse.data) {
        setSubmissions(submissionsResponse.data);
      } else {
        setError(submissionsResponse.message || '获取提交记录失败');
      }

      if (schemesResponse.success && schemesResponse.data) {
        setSchemes(schemesResponse.data);
      }
    } catch (error) {
      console.error('获取提交记录失败:', error);
      setError('加载数据时发生错误');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    fetchSubmissions();
  }, []);
  
  // 查看详情
  const handleViewDetails = (submissionId: string) => {
    navigate(`/submission/${submissionId}`);
  };
  
  // 新建认证
  const handleCreateSubmission = (schemeId: number) => {
    navigate(`/submit/${schemeId}`);
  };
  
  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
        >
          返回首页
        </Button>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      {/* 页面标题 */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          认证状态
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchSubmissions}
        >
          刷新状态
        </Button>
      </Box>
      
      {submissions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            您还没有进行任何认证
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            请选择一个认证方案开始您的身份验证
          </Typography>
          
          {schemes.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                可用的认证方案:
              </Typography>
              <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ justifyContent: 'center', mt: 2 }}>
                {schemes.map(scheme => (
                  <Card key={scheme.id} sx={{ maxWidth: 300, width: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {scheme.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {scheme.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        onClick={() => handleCreateSubmission(scheme.id)}
                        fullWidth
                      >
                        开始认证
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Stack>
            </Box>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate('/schemes')}
              startIcon={<AddIcon />}
            >
              查看认证方案
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={3}>
          {submissions.map(submission => {
            const scheme = schemes.find(s => s.id === submission.schemeId);
            return (
              <Card key={submission.id} variant="outlined">
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: "auto" }}>
                      <Chip
                        icon={statusIcons[submission.status]}
                        label={statusLabels[submission.status]}
                        color={statusColors[submission.status]}
                      />
                    </Grid>
                    <Grid size="grow">
                      <Typography variant="h6" component="div">
                        {scheme?.name || `认证方案 #${submission.schemeId}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        提交时间: {format(new Date(submission.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button size="small" onClick={() => handleViewDetails(submission.id)}>
                    查看详情
                  </Button>
                  {submission.status === 'rejected' && (
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => handleCreateSubmission(submission.schemeId)}
                    >
                      重新提交
                    </Button>
                  )}
                </CardActions>
              </Card>
            );
          })}
        </Stack>
      )}
    </MainLayout>
  );
};

export default SubmissionStatus; 