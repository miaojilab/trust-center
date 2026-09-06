import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Divider, CircularProgress, Alert, Chip, Stack, Card, CardContent, IconButton } from '@mui/material';
import { CheckCircle as CheckIcon, Cancel as CancelIcon, Pending as PendingIcon, AccessTime as TimeIcon, ArrowBack as BackIcon, Description as DescriptionIcon } from '@mui/icons-material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import { format } from 'date-fns';
import MainLayout from '../components/layout/MainLayout';
import { userAPI } from '../services/api';
import { KYCSubmission } from '../types';

// 状态到图标的映射
const statusIcons: Record<string, React.ReactElement> = {
  pending: <PendingIcon color="warning" />,
  approved: <CheckIcon color="success" />,
  rejected: <CancelIcon color="error" />,
};

// 状态颜色映射
const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

// 状态标签映射
const statusLabels: Record<string, string> = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
};

// 提交详情页面
const SubmissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);

  // 获取提交详情
  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await userAPI.getSubmissionById(id);
        
        if (response.success && response.data) {
          setSubmission(response.data);
        } else {
          setError(response.message || '获取提交详情失败');
        }
      } catch (error) {
        console.error('获取提交详情失败:', error);
        setError('加载数据时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [id]);
  
  // 返回认证状态页面
  const handleBack = () => {
    navigate('/status');
  };
  
  // 渲染字段值
  const renderFieldValue = (field: any, value: any) => {
    const fieldType = field.type;
    
    switch (fieldType) {
      case 'image':
        return value ? (
          <Box>
            <img src={value} alt={field.label} style={{ maxWidth: '200px', maxHeight: '200px' }} />
          </Box>
        ) : (
          <Typography color="text.secondary">无图片</Typography>
        );
      
      case 'file':
        return value ? (
          <Box>
            <Button variant="outlined" size="small" href={value} target="_blank">
              查看文件
            </Button>
          </Box>
        ) : (
          <Typography color="text.secondary">无文件</Typography>
        );
      
      case 'date':
        return value ? format(new Date(value), 'yyyy-MM-dd') : '';
      
      default:
        return value === undefined || value === null ? '' : String(value);
    }
  };
  
  // 渲染表单数据
  const renderFormData = () => {
    if (!submission || !submission.data) return <Typography>无表单数据</Typography>;
    
    // 获取方案字段定义
    const fields = submission.KYCScheme?.fields || [];
    const formData = submission.data;
    
    return (
      <Stack spacing={2}>
        {fields.map((field: any) => (
          <Paper key={field.id || field.name} elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {field.label}
                  {field.required && <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>}
                </Typography>
                {field.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {field.description}
                  </Typography>
                )}
              </Box>
              <Box sx={{ mt: 1 }}>
                {renderFieldValue(field, formData[field.name])}
              </Box>
            </Box>
          </Paper>
        ))}
      </Stack>
    );
  };
  
  // 渲染审核历史
  const renderHistory = () => {
    if (!submission || !submission.history || submission.history.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">暂无审核历史</Typography>
        </Box>
      );
    }
    
    return (
      <Timeline position="alternate">
        {submission.history.map((item, index) => (
          <TimelineItem key={index}>
            <TimelineOppositeContent color="text.secondary">
              {item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm:ss') : ''}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={
                item.status === 'approved' ? 'success' :
                item.status === 'rejected' ? 'error' :
                'warning'
              }>
                {
                  item.status === 'approved' ? <CheckIcon /> :
                  item.status === 'rejected' ? <CancelIcon /> :
                  <PendingIcon />
                }
              </TimelineDot>
              {index < (submission.history?.length || 0) - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" component="span">
                  {
                    item.status === 'approved' ? '审核通过' :
                    item.status === 'rejected' ? '审核拒绝' :
                    '提交审核'
                  }
                </Typography>
                {item.reviewerName && (
                  <Typography>审核人: {item.reviewerName}</Typography>
                )}
                {item.reason && (
                  <Typography>原因: {item.reason}</Typography>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
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
  
  if (error || !submission) {
    return (
      <MainLayout>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            提交详情
          </Typography>
        </Box>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || '未找到提交记录'}
        </Alert>
        
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleBack}
        >
          返回认证列表
        </Button>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      {/* 标题和返回按钮 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          认证详情
        </Typography>
      </Box>
      
      {/* 状态卡片 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ flex: '1 1 50%' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box>
                  {statusIcons[submission.status]}
                </Box>
                <Box>
                  <Typography variant="h6">
                    {submission.KYCScheme?.name || `认证方案 #${submission.schemeId}`}
                  </Typography>
                  <Chip
                    label={statusLabels[submission.status]}
                    color={statusColors[submission.status]}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Stack>
            </Box>
            <Box sx={{ flex: '1 1 50%' }}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>提交时间:</strong> {format(new Date(submission.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </Typography>
                {submission.reviewedAt && (
                  <Typography variant="body2">
                    <strong>审核时间:</strong> {format(new Date(submission.reviewedAt), 'yyyy-MM-dd HH:mm:ss')}
                  </Typography>
                )}
                {submission.status === 'rejected' && submission.rejectReason && (
                  <Typography variant="body2" color="error">
                    <strong>拒绝原因:</strong> {submission.rejectReason}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* 表单数据 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <DescriptionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          表单数据
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {renderFormData()}
      </Paper>
      
      {/* 审核历史 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          <TimeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          审核历史
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {renderHistory()}
      </Paper>
    </MainLayout>
  );
};

export default SubmissionDetail; 