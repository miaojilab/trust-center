import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Divider, Grid, Card, CardContent, Tabs, Tab, Alert, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Stack, Chip, Avatar, IconButton } from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon, Description as FormIcon, InsertDriveFile as FileIcon, ArrowBack as BackIcon, Person as PersonIcon, History as HistoryIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import MainLayout from '../../components/layout/MainLayout';
import { adminAPI } from '../../services/api';
import { KYCSubmission } from '../../types';

// 管理员审核页面
const AdminReview: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  
  // 状态
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // 审核对话框状态
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // 获取提交详情
  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getSubmission(submissionId);
      
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
  }, [submissionId]);
  
  // 初始加载
  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);
  
  // 处理标签切换
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // 处理返回
  const handleBack = () => {
    navigate('/admin/pending');
  };
  
  // 处理审核通过
  const handleApprove = async () => {
    if (!submissionId) return;
    
    try {
      setProcessing(true);
      
      const response = await adminAPI.approveSubmission(submissionId);
      
      if (response.success) {
        setApproveDialogOpen(false);
        // 重新获取提交详情
        fetchSubmission();
      } else {
        setError(response.message || '审核通过操作失败');
      }
    } catch (error) {
      console.error('审核通过操作失败:', error);
      setError('处理审核时发生错误');
    } finally {
      setProcessing(false);
    }
  };
  
  // 处理审核拒绝
  const handleReject = async () => {
    if (!submissionId) return;
    
    try {
      setProcessing(true);
      
      const response = await adminAPI.rejectSubmission(submissionId, {
        reason: rejectReason
      });
      
      if (response.success) {
        setRejectDialogOpen(false);
        // 重新获取提交详情
        fetchSubmission();
      } else {
        setError(response.message || '审核拒绝操作失败');
      }
    } catch (error) {
      console.error('审核拒绝操作失败:', error);
      setError('处理审核时发生错误');
    } finally {
      setProcessing(false);
    }
  };
  
  // 渲染表单数据
  const renderFormData = () => {
    if (!submission || !submission.data) {
      return <Alert severity="info">没有表单数据</Alert>;
    }
    
    // 获取字段定义
    const fieldDefinitions = submission.KYCScheme?.fields || [];
    const formData = submission.data;
    
    // 如果没有数据显示
    if (Object.keys(formData).length === 0) {
      return <Alert severity="info">表单数据为空</Alert>;
    }
    
    return (
      <Grid container spacing={3}>
        {fieldDefinitions.map((field, index) => {
          const fieldValue = formData[field.name];
          const fieldType = field.type;
          
          return (
            <Grid size={{ xs: 12, md: fieldType === 'longText' ? 12 : 6 }} key={`field-${index}-${field.name}`}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {field.label}
                  </Typography>
                  
                  {fieldType === 'file' ? (
                    <Box>
                      {fieldValue ? (
                        <Button
                          startIcon={<FileIcon />}
                          variant="outlined"
                          size="small"
                          onClick={() => fieldValue && typeof fieldValue === 'object' && 'data' in fieldValue ? 
                            window.open(fieldValue.data as string, '_blank') : null}
                        >
                          查看文件
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">未上传文件</Typography>
                      )}
                    </Box>
                  ) : fieldType === 'longText' ? (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {typeof fieldValue === 'object' 
                          ? JSON.stringify(fieldValue, null, 2) 
                          : fieldValue 
                            ? String(fieldValue) 
                            : '无内容'}
                      </Typography>
                    </Paper>
                  ) : (
                    <Typography variant="body1">
                      {typeof fieldValue === 'object' 
                        ? JSON.stringify(fieldValue, null, 2) 
                        : fieldValue 
                          ? String(fieldValue) 
                          : "未填写"}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };
  
  // 渲染用户信息
  const renderUserInfo = () => {
    if (!submission) {
      return <Alert severity="info">无法加载提交记录</Alert>;
    }
    
    // 优先使用user属性，如果不存在则使用User属性
    const userInfo = submission.user || submission.User;
    
    if (!userInfo) {
      return <Alert severity="info">无法加载用户信息</Alert>;
    }
    
    // 统一用户字段名
    const userName = (userInfo as any).name || (userInfo as any).username || '未知用户';
    const userEmail = userInfo.email || '无邮箱';
    const userId = userInfo.id;
    const userCreatedAt = userInfo.createdAt;
    const userLastLogin = userInfo.lastLogin;
    
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, mr: 2 }} />
            <Box>
              <Typography variant="h6">{userName}</Typography>
              <Typography variant="body2" color="text.secondary">用户ID: {userId}</Typography>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                邮箱
              </Typography>
              <Typography variant="body1">
                {userEmail}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                手机号
              </Typography>
              <Typography variant="body1">
                {(userInfo as any).phone || '未提供'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                注册时间
              </Typography>
              <Typography variant="body1">
                {userCreatedAt ? format(new Date(userCreatedAt), 'yyyy-MM-dd HH:mm:ss') : '未知'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                上次登录
              </Typography>
              <Typography variant="body1">
                {userLastLogin ? format(new Date(userLastLogin), 'yyyy-MM-dd HH:mm:ss') : '未知'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染审核历史
  const renderHistory = () => {
    if (!submission) {
      return <Alert severity="info">无法加载提交记录</Alert>;
    }
    
    // 如果后端没有提供历史记录，根据当前状态生成一个虚拟历史记录
    const hasRealHistory = submission.history && submission.history.length > 0;
    
    // 如果没有真实的历史记录但有状态信息，创建一个虚拟历史记录
    if (!hasRealHistory && submission.status !== 'pending') {
      const virtualHistory = [{
        status: submission.status,
        reviewerId: submission.reviewerId,
        reviewerName: '管理员',
        reason: submission.status === 'rejected' ? submission.rejectReason : undefined,
        createdAt: submission.reviewedAt || submission.updatedAt || submission.createdAt
      }];
      
      return (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>系统未记录完整的审核历史，以下是根据当前状态推断的历史记录</Alert>
          {virtualHistory.map((record, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Chip 
                      label={record.status === 'approved' ? '通过' : record.status === 'rejected' ? '拒绝' : record.status}
                      color={record.status === 'approved' ? 'success' : record.status === 'rejected' ? 'error' : 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" component="span" color="text.secondary">
                      {record.createdAt ? format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm:ss') : '未知时间'}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    操作人: {record.reviewerName || record.reviewerId || '系统'}
                  </Typography>
                </Stack>
                
                {record.reason && (
                  <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    原因: {record.reason}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }
    
    // 如果状态是pending且没有历史记录
    if (!hasRealHistory && submission.status === 'pending') {
      return <Alert severity="info">尚未进行审核，暂无审核历史记录</Alert>;
    }
    
    // 如果有真实的历史记录，显示它们
    return (
      <Box>
        {submission.history!.map((record, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Chip 
                    label={record.status === 'approved' ? '通过' : record.status === 'rejected' ? '拒绝' : record.status}
                    color={record.status === 'approved' ? 'success' : record.status === 'rejected' ? 'error' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" component="span" color="text.secondary">
                    {format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  操作人: {record.reviewerName || record.reviewerId || '系统'}
                </Typography>
              </Stack>
              
              {record.reason && (
                <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  原因: {record.reason}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };
  
  return (
    <MainLayout>
      {/* 顶部导航与标题 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            审核申请
          </Typography>
        </Box>
        
        {/* 审核操作按钮 */}
        {submission && submission.status === 'pending' && (
          <Box>
            <Button 
              variant="contained" 
              color="success" 
              startIcon={<ApproveIcon />} 
              sx={{ mr: 1 }}
              onClick={() => setApproveDialogOpen(true)}
            >
              通过
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              startIcon={<RejectIcon />}
              onClick={() => setRejectDialogOpen(true)}
            >
              拒绝
            </Button>
          </Box>
        )}
      </Box>
      
      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* 加载中 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : submission ? (
        <>
          {/* 基本信息卡片 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>提交信息</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  提交ID
                </Typography>
                <Typography variant="body1">
                  {submission.id}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  方案名称
                </Typography>
                <Typography variant="body1">
                  {submission.KYCScheme?.name || `方案#${submission.schemeId}`}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  提交时间
                </Typography>
                <Typography variant="body1">
                  {format(new Date(submission.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  状态
                </Typography>
                <Chip
                  label={
                    submission.status === 'pending' ? '待审核' :
                    submission.status === 'approved' ? '已通过' :
                    submission.status === 'rejected' ? '已拒绝' :
                    submission.status
                  }
                  color={
                    submission.status === 'pending' ? 'warning' :
                    submission.status === 'approved' ? 'success' :
                    submission.status === 'rejected' ? 'error' :
                    'default'
                  }
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
          
          {/* 标签页 */}
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab icon={<FormIcon />} label="表单数据" />
              <Tab icon={<PersonIcon />} label="用户信息" />
              <Tab icon={<HistoryIcon />} label="审核历史" />
            </Tabs>
            
            <Divider />
            
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && renderFormData()}
              {activeTab === 1 && renderUserInfo()}
              {activeTab === 2 && renderHistory()}
            </Box>
          </Paper>
        </>
      ) : (
        <Alert severity="warning">
          未找到ID为 {submissionId} 的提交记录
        </Alert>
      )}
      
      {/* 通过确认对话框 */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>确认通过身份认证申请</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要通过该身份认证申请吗？审核通过后，用户将被允许使用需要身份认证的服务。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApproveDialogOpen(false)} 
            color="inherit"
            disabled={processing}
          >
            取消
          </Button>
          <Button 
            onClick={handleApprove} 
            color="success" 
            variant="contained"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <ApproveIcon />}
          >
            {processing ? '处理中...' : '确认通过'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 拒绝确认对话框 */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>确认拒绝身份认证申请</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要拒绝该身份认证申请吗？请提供拒绝的原因，该原因将会展示给用户。
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="拒绝原因"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRejectDialogOpen(false)} 
            color="inherit"
            disabled={processing}
          >
            取消
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={processing || !rejectReason.trim()}
            startIcon={processing ? <CircularProgress size={20} /> : <RejectIcon />}
          >
            {processing ? '处理中...' : '确认拒绝'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default AdminReview;