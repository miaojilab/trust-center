import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  DialogContentText,
  Stack,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  VerifiedUser as VerifiedUserIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { KYCSubmission, KYCScheme, User } from '../../types';
import MainLayout from '../../components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const statusColors = {
  approved: 'success',
  rejected: 'error',
  pending: 'warning',
  not_submitted: 'default'
};

const AdminQuery: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [schemeId, setSchemeId] = useState<number | ''>('');
  const [userId, setUserId] = useState<number | ''>('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [schemes, setSchemes] = useState<KYCScheme[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 详情对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 状态修改相关
  const [changingStatus, setChangingStatus] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'approved' | 'rejected' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 添加提示状态
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 获取所有认证方案
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const response = await adminAPI.getSchemes();
        if (response.success && response.data) {
          setSchemes(response.data);
        }
      } catch (error) {
        console.error('获取认证方案失败:', error);
      }
    };

    fetchSchemes();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // 切换标签时重置状态
    setSubmissions([]);
    setError(null);
    setUserId('');
    setUsername('');
    setEmail('');
  };

  // 根据认证方案查询
  const handleQueryByScheme = async () => {
    if (!schemeId) {
      setError('请选择一个认证方案');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 获取方案名称
      const selectedScheme = schemes.find(scheme => scheme.id === schemeId);
      const schemeName = selectedScheme ? selectedScheme.name : `方案 #${schemeId}`;
      
      // 调用API查询某个认证的所有认证情况
      const response = await adminAPI.getSubmissionsByScheme(Number(schemeId));
      if (response.success && response.data) {
        setSubmissions(response.data);
        if (response.data.length === 0) {
          setError(`未找到方案「${schemeName}」的相关认证记录`);
        }
      } else {
        setError('查询失败: ' + (response.message || '未知错误'));
      }
    } catch (error: any) {
      console.error('查询失败:', error);
      setError('查询失败: ' + (error.response?.data?.message || error.message || '请稍后重试'));
    } finally {
      setLoading(false);
    }
  };

  // 查询所有用户
  const handleQueryAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // 调用API查询所有用户
      const response = await adminAPI.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
        if (response.data.length === 0) {
          setError('暂无用户数据');
        }
      } else {
        setError('查询失败: ' + (response.message || '未知错误'));
      }
    } catch (error: any) {
      console.error('查询失败:', error);
      setError('查询失败: ' + (error.response?.data?.message || error.message || '请稍后重试'));
    } finally {
      setLoading(false);
    }
  };

  // 根据用户查询认证
  const handleQueryByUser = async () => {
    if (!userId && !username && !email) {
      setError('请输入用户ID、用户名或邮箱');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 查询时显示用户识别信息
      let userIdentifier = userId ? `用户ID: ${userId}` : 
                          username ? `用户名: ${username}` : 
                          `邮箱: ${email}`;
      
      // 调用API查询用户的认证记录
      const response = await adminAPI.getSubmissionsByUser({
        userId: userId ? Number(userId) : undefined,
        username,
        email
      });
      
      if (response.success && response.data) {
        setSubmissions(response.data);
        
        // 如果有数据，更新用户标识信息
        if (response.data.length > 0 && response.data[0].User) {
          const user = response.data[0].User;
          userIdentifier = `${user.username} (ID: ${user.id})`;
        }
        
        // 检查是否有结果
        if (response.data.length === 0) {
          setError(`${userIdentifier} 暂无认证记录`);
        }
      } else {
        setError('查询失败: ' + (response.message || '未知错误'));
      }
    } catch (error: any) {
      console.error('查询失败:', error);
      setError('查询失败: ' + (error.response?.data?.message || error.message || '请稍后重试'));
    } finally {
      setLoading(false);
    }
  };

  // 清空用户查询条件
  const handleClearUserForm = () => {
    setUserId('');
    setUsername('');
    setEmail('');
    setError(null);
  };

  // 查看提交详情
  const handleViewSubmissionDetail = async (submissionId: string) => {
    try {
      setLoadingDetails(true);
      const response = await adminAPI.getSubmission(submissionId);
      if (response.success && response.data) {
        setSelectedSubmission(response.data);
        setDetailDialogOpen(true);
      } else {
        setError('获取详情失败: ' + (response.message || '未知错误'));
      }
    } catch (error: any) {
      console.error('获取详情失败:', error);
      setError('获取详情失败: ' + (error.response?.data?.message || error.message || '请稍后重试'));
    } finally {
      setLoadingDetails(false);
    }
  };

  // 关闭详情对话框
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
  };

  // 跳转到完整审核页面
  const handleGoToReview = (submissionId: string) => {
    navigate(`/admin/review/${submissionId}`);
  };

  // 渲染提交数据详情
  const renderSubmissionData = (data: Record<string, any> = {}, fields: any[] = []) => {
    if (!data || Object.keys(data).length === 0) {
      return <Typography color="text.secondary">无数据</Typography>;
    }

    // 如果有字段定义，按字段渲染
    if (fields && fields.length > 0) {
      return (
        <List disablePadding>
          {fields.map(field => (
            <ListItem key={field.name} divider>
              <ListItemText
                primary={field.label || field.name}
                secondary={
                  data[field.name] !== undefined && data[field.name] !== null
                    ? String(data[field.name])
                    : '未填写'
                }
              />
            </ListItem>
          ))}
        </List>
      );
    }

    // 没有字段定义时，直接遍历数据
    return (
      <List disablePadding>
        {Object.entries(data).map(([key, value]) => (
          <ListItem key={key} divider>
            <ListItemText
              primary={key}
              secondary={value !== undefined && value !== null ? String(value) : '未填写'}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  // 刷新当前查询
  const refreshCurrentQuery = () => {
    if (tabValue === 0 && schemeId) {
      handleQueryByScheme();
    } else if (tabValue === 1) {
      if (userId || username || email) {
        handleQueryByUser();
      } else if (users.length > 0) {
        handleQueryAllUsers();
      }
    }
  };

  // 打开状态修改确认对话框
  const handleStatusChangeClick = (status: 'approved' | 'rejected') => {
    setNewStatus(status);
    setConfirmDialogOpen(true);
  };

  // 关闭确认对话框
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setRejectReason('');
  };

  // 执行状态修改
  const handleConfirmStatusChange = async () => {
    if (!selectedSubmission || !newStatus) return;
    
    try {
      setChangingStatus(true);
      
      if (newStatus === 'approved') {
        const response = await adminAPI.approveSubmission(selectedSubmission.id);
        if (response.success) {
          // 更新当前选中的submission
          setSelectedSubmission({
            ...selectedSubmission,
            status: 'approved',
            reviewedAt: new Date().toISOString()
          });
          
          // 更新列表中的数据
          setSubmissions(prev => 
            prev.map(sub => 
              sub.id === selectedSubmission.id 
                ? { ...sub, status: 'approved' } 
                : sub
            )
          );
          
          // 显示成功提示
          setSuccessMessage(selectedSubmission.status === 'pending' 
            ? '认证已成功批准' 
            : '认证状态已成功更新为已批准');
          setSnackbarOpen(true);
          
          setError(null);
        } else {
          setError('审批失败: ' + (response.message || '未知错误'));
        }
      } else if (newStatus === 'rejected') {
        const response = await adminAPI.rejectSubmission(selectedSubmission.id, { reason: rejectReason });
        if (response.success) {
          // 更新当前选中的submission
          setSelectedSubmission({
            ...selectedSubmission,
            status: 'rejected',
            rejectReason,
            reviewedAt: new Date().toISOString()
          });
          
          // 更新列表中的数据
          setSubmissions(prev => 
            prev.map(sub => 
              sub.id === selectedSubmission.id 
                ? { ...sub, status: 'rejected' } 
                : sub
            )
          );
          
          // 显示成功提示
          setSuccessMessage(selectedSubmission.status === 'pending' 
            ? '认证已成功拒绝' 
            : '认证状态已成功更新为已拒绝');
          setSnackbarOpen(true);
          
          setError(null);
        } else {
          setError('拒绝失败: ' + (response.message || '未知错误'));
        }
      }
    } catch (error: any) {
      console.error('状态修改失败:', error);
      setError('操作失败: ' + (error.response?.data?.message || error.message || '请稍后重试'));
    } finally {
      setChangingStatus(false);
      setConfirmDialogOpen(false);
      setRejectReason('');
    }
  };

  // 关闭提示
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          认证查询
        </Typography>
        <Typography variant="body1" color="text.secondary">
          查询特定认证方案或用户的认证情况
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="查询选项卡"
          centered
        >
          <Tab icon={<VerifiedUserIcon />} label="按认证方案查询" />
          <Tab icon={<PersonIcon />} label="按用户查询" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '240px' }}>
                <FormControl fullWidth>
                  <InputLabel id="scheme-select-label">认证方案</InputLabel>
                  <Select
                    labelId="scheme-select-label"
                    value={schemeId}
                    label="认证方案"
                    onChange={(e) => setSchemeId(e.target.value as number)}
                  >
                    {schemes.map((scheme) => (
                      <MenuItem key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '240px' }}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleQueryByScheme}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : '查询'}
                </Button>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 calc(33% - 8px)', minWidth: '240px' }}>
                  <TextField
                    fullWidth
                    label="用户ID"
                    type="number"
                    variant="outlined"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value === '' ? '' : Number(e.target.value));
                      setUsername('');
                      setEmail('');
                    }}
                    disabled={!!username || !!email}
                  />
                </Box>
                <Box sx={{ flex: '1 1 calc(33% - 8px)', minWidth: '240px' }}>
                  <TextField
                    fullWidth
                    label="用户名"
                    variant="outlined"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUserId('');
                      setEmail('');
                    }}
                    disabled={!!userId || !!email}
                  />
                </Box>
                <Box sx={{ flex: '1 1 calc(33% - 8px)', minWidth: '240px' }}>
                  <TextField
                    fullWidth
                    label="电子邮箱"
                    variant="outlined"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setUserId('');
                      setUsername('');
                    }}
                    disabled={!!userId || !!username}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleQueryByUser}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : '查询'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearUserForm}
                  disabled={loading}
                >
                  清空
                </Button>
              </Box>
              <Box>
                <Button
                  variant="outlined"
                  onClick={handleQueryAllUsers}
                  disabled={loading}
                  fullWidth
                >
                  查询所有用户
                </Button>
              </Box>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {tabValue === 0 && submissions.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            认证提交记录
          </Typography>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="认证提交表格">
              <TableHead>
                <TableRow>
                  <TableCell>提交ID</TableCell>
                  <TableCell>用户</TableCell>
                  <TableCell>方案</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>提交时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{typeof submission.id === 'string' ? submission.id.substring(0, 8) + '...' : submission.id}</TableCell>
                    <TableCell>
                      {submission.User ? (
                        <>
                          <Typography variant="body2" fontWeight="bold">{submission.User.username}</Typography>
                          <Typography variant="body2" color="text.secondary">{submission.User.email}</Typography>
                        </>
                      ) : (
                        `用户ID: ${submission.userId || '未知'}`
                      )}
                    </TableCell>
                    <TableCell>{submission.KYCScheme?.name || `方案 #${submission.schemeId}`}</TableCell>
                    <TableCell>
                      <Chip 
                        label={submission.status} 
                        color={statusColors[submission.status as keyof typeof statusColors] as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{new Date(submission.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleViewSubmissionDetail(submission.id)}
                        disabled={loadingDetails}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 1 && users.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            用户列表
          </Typography>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="用户表格">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>用户名</TableCell>
                  <TableCell>电子邮件</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow 
                    key={user.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => {
                          setUserId(user.id);
                          handleQueryByUser();
                        }}
                      >
                        查看认证
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 1 && submissions.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden', mt: 4 }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            用户认证情况
          </Typography>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="用户认证表格">
              <TableHead>
                <TableRow>
                  <TableCell>提交ID</TableCell>
                  <TableCell>认证方案</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>提交时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{typeof submission.id === 'string' ? submission.id.substring(0, 8) + '...' : submission.id}</TableCell>
                    <TableCell>{submission.KYCScheme?.name || `方案 #${submission.schemeId}`}</TableCell>
                    <TableCell>
                      <Chip 
                        label={submission.status} 
                        color={statusColors[submission.status as keyof typeof statusColors] as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{new Date(submission.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleViewSubmissionDetail(submission.id)}
                        disabled={loadingDetails}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 详情对话框 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleCloseDetailDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          认证详情
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedSubmission ? (
            <Box>
              <Typography variant="h6" gutterBottom>基本信息</Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">认证ID</Typography>
                    <Typography variant="body1">{selectedSubmission.id}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">方案名称</Typography>
                    <Typography variant="body1">{selectedSubmission.KYCScheme?.name || `方案 #${selectedSubmission.schemeId}`}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">用户</Typography>
                    <Typography variant="body1">
                      {selectedSubmission.User?.username || `用户ID: ${selectedSubmission.userId}`}
                      {selectedSubmission.User?.email && ` (${selectedSubmission.User.email})`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">状态</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={selectedSubmission.status} 
                        color={statusColors[selectedSubmission.status as keyof typeof statusColors] as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"} 
                        size="small" 
                      />
                      {changingStatus && <CircularProgress size={20} />}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">提交时间</Typography>
                    <Typography variant="body1">{new Date(selectedSubmission.createdAt).toLocaleString()}</Typography>
                  </Box>
                  {selectedSubmission.reviewedAt && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">审核时间</Typography>
                      <Typography variant="body1">{new Date(selectedSubmission.reviewedAt).toLocaleString()}</Typography>
                    </Box>
                  )}
                  {selectedSubmission.reviewerId && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">审核人ID</Typography>
                      <Typography variant="body1">{selectedSubmission.reviewerId}</Typography>
                    </Box>
                  )}
                  {selectedSubmission.rejectReason && (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Typography variant="body2" color="text.secondary">拒绝原因</Typography>
                      <Typography variant="body1" color="error">{selectedSubmission.rejectReason}</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>

              <Typography variant="h6" gutterBottom>用户填写的数据</Typography>
              <Paper sx={{ mb: 3 }}>
                {renderSubmissionData(selectedSubmission.data, selectedSubmission.KYCScheme?.fields)}
              </Paper>
            </Box>
          ) : (
            <Typography color="error">未找到数据</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'row', justifyContent: 'space-between', p: 2 }}>
          <Stack direction="row" spacing={1}>
            {selectedSubmission && selectedSubmission.status !== 'approved' && (
              <Tooltip title="批准此认证">
                <Button 
                  color="success" 
                  variant="contained"
                  startIcon={<ApproveIcon />}
                  onClick={() => handleStatusChangeClick('approved')}
                  disabled={changingStatus}
                >
                  批准
                </Button>
              </Tooltip>
            )}
            {selectedSubmission && selectedSubmission.status !== 'rejected' && (
              <Tooltip title="拒绝此认证">
                <Button 
                  color="error" 
                  variant="contained"
                  startIcon={<RejectIcon />}
                  onClick={() => handleStatusChangeClick('rejected')}
                  disabled={changingStatus}
                >
                  拒绝
                </Button>
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button onClick={handleCloseDetailDialog}>关闭</Button>
            <Button 
              color="primary" 
              variant="contained"
              onClick={() => handleGoToReview(selectedSubmission!.id)}
            >
              前往审核页面
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* 状态修改确认对话框 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>
          {selectedSubmission?.status === 'pending' 
            ? `确认${newStatus === 'approved' ? '批准' : '拒绝'}此认证？` 
            : `确认修改状态？`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedSubmission?.status === 'pending' 
              ? (newStatus === 'approved' 
                ? '确定要批准此认证申请吗？此操作不可撤销。' 
                : '确定要拒绝此认证申请吗？此操作不可撤销。')
              : `确定要将此认证状态从「${selectedSubmission?.status === 'approved' ? '已批准' : '已拒绝'}」更改为「${newStatus === 'approved' ? '已批准' : '已拒绝'}」吗？`
            }
          </DialogContentText>
          {newStatus === 'rejected' && (
            <TextField
              autoFocus
              margin="dense"
              label="拒绝原因"
              fullWidth
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              variant="outlined"
              sx={{ mt: 2 }}
              error={newStatus === 'rejected' && !rejectReason.trim()}
              helperText={newStatus === 'rejected' && !rejectReason.trim() ? "拒绝时必须提供原因" : ""}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>取消</Button>
          <Button 
            onClick={handleConfirmStatusChange} 
            color={newStatus === 'approved' ? 'success' : 'error'}
            variant="contained"
            disabled={newStatus === 'rejected' && !rejectReason.trim()}
          >
            确认{selectedSubmission?.status !== 'pending' ? '修改' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 成功提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={successMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </MainLayout>
  );
};

export default AdminQuery; 