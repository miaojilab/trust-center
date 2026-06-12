import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Stack,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  PendingActions as PendingIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import MainLayout from '../../components/layout/MainLayout';
import { adminAPI } from '../../services/api';
import { KYCSubmission } from '../../types';

// 状态颜色映射
const statusColors: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
};

// 状态标签映射
const statusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
};

const AdminPendingList: React.FC = () => {
  const navigate = useNavigate();
  
  // 分页状态
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 列表数据
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // 加载状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // 筛选菜单
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const filterMenuOpen = Boolean(filterAnchorEl);
  
  // 刷新状态
  const [refreshing, setRefreshing] = useState(false);
  
  // 获取提交数据
  const fetchSubmissions = async (pageNum = page, rowsNum = rowsPerPage, search = searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pageNum,
        limit: rowsNum,
        search: search,
        ...(status && { status })
      };
      
      const response = await adminAPI.getPendingSubmissions(params);
      
      if (response.success && response.data) {
        setSubmissions(response.data.items || []);
        setTotalCount(response.data.total || 0);
      } else {
        setError(response.message || '获取待审核列表失败');
      }
    } catch (error) {
      console.error('获取待审核列表失败:', error);
      setError('加载数据时发生错误');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 初始加载和筛选条件变化时获取数据
  useEffect(() => {
    fetchSubmissions();
  }, [page, rowsPerPage, status, startDate, endDate]);
  
  // 刷新数据
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubmissions();
  };
  
  // 处理页面变化
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    fetchSubmissions(newPage, rowsPerPage);
  };
  
  // 处理每页条数变化
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchSubmissions(0, newRowsPerPage);
  };
  
  // 处理搜索
  const handleSearch = () => {
    setPage(0);
    fetchSubmissions(0, rowsPerPage, searchTerm);
  };
  
  // 处理搜索输入变化
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // 处理按回车键搜索
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  
  // 打开筛选菜单
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  // 关闭筛选菜单
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // 应用状态筛选
  const handleStatusFilter = (statusValue: string | null) => {
    setStatus(statusValue);
    setPage(0);
    handleFilterClose();
  };
  
  // 清除所有筛选
  const handleClearFilters = () => {
    setStatus(null);
    setStartDate(null);
    setEndDate(null);
    setPage(0);
    handleFilterClose();
  };
  
  // 查看详情
  const handleViewSubmission = (submissionId: string) => {
    navigate(`/admin/review/${submissionId}`);
  };
  
  return (
    <MainLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          待审核身份认证申请
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? '刷新中...' : '刷新列表'}
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="搜索用户名或ID"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            搜索
          </Button>
        </Stack>
      </Paper>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <PendingIcon color="warning" fontSize="large" />
            <div>
              <Typography variant="h6">待审核申请</Typography>
              <Typography variant="h4" color="warning.main">
                {loading ? <CircularProgress size={24} /> : totalCount}
              </Typography>
            </div>
          </Stack>
        </CardContent>
      </Card>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading && !refreshing ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>用户信息</TableCell>
                  <TableCell>提交时间</TableCell>
                  <TableCell>方案</TableCell>
                  <TableCell>字段数</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      暂无待审核的身份认证申请
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => {
                    // 确定表单字段数量
                    const fieldCount = submission.data ? Object.keys(submission.data).length : 0;
                    
                    return (
                      <TableRow key={submission.id} hover>
                        <TableCell>
                          {typeof submission.id === 'string' 
                            ? `${submission.id.substring(0, 8)}...` 
                            : submission.id}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {submission.user?.name || submission.User?.username || '未知用户'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {submission.user?.email || submission.User?.email || '无邮箱'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {format(new Date(submission.createdAt), 'yyyy-MM-dd HH:mm')}
                        </TableCell>
                        <TableCell>
                          {submission.KYCScheme?.name || `方案#${submission.schemeId}`}
                        </TableCell>
                        <TableCell>
                          {fieldCount}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="查看详情">
                            <IconButton
                              color="primary"
                              onClick={() => handleViewSubmission(submission.id)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="每页行数:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} / ${count !== -1 ? count : `超过 ${to}`}`}
            />
          </TableContainer>
        </>
      )}
    </MainLayout>
  );
};

export default AdminPendingList; 