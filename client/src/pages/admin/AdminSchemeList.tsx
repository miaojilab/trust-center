import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import MainLayout from '../../components/layout/MainLayout';
import { KYCScheme } from '../../types';

const AdminSchemeList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [schemes, setSchemes] = useState<KYCScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null
  );

  // 加载方案列表
  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSchemes();
      if (response.success) {
        const processedSchemes = response.data?.map(scheme => ({
          ...scheme,
          // 确保根据 status 字段正确设置 isActive
          isActive: scheme.status === 'active'
        })) || [];
        setSchemes(processedSchemes);
      } else {
        setError(response.message || '加载方案失败');
      }
    } catch (error) {
      console.error('加载方案失败:', error);
      setError('无法加载认证方案');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
    
    // 清除location.state，防止刷新后再次显示消息
    if (location.state?.message) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 处理创建新方案
  const handleCreateScheme = () => {
    navigate('/admin/schemes/create');
  };

  // 处理查看方案
  const handleViewScheme = (id: number) => {
    navigate(`/admin/schemes/${id}`);
  };

  // 处理编辑方案
  const handleEditScheme = (id: number) => {
    navigate(`/admin/schemes/edit/${id}`);
  };

  // 处理删除方案
  const handleDeleteScheme = async (id: number) => {
    if (!window.confirm('确定要删除此认证方案吗？此操作不可逆。')) {
      return;
    }

    try {
      const response = await adminAPI.deleteScheme(id);
      if (response.success) {
        setSuccessMessage('方案已成功删除');
        // 重新加载列表
        fetchSchemes();
      } else {
        setError(response.message || '删除方案失败');
      }
    } catch (error) {
      console.error('删除方案失败:', error);
      setError('删除方案时发生错误');
    }
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          认证方案管理
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreateScheme}
        >
          创建新方案
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {loading ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>加载中...</Typography>
        </Paper>
      ) : schemes.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无认证方案
          </Typography>
          <Typography color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            点击"创建新方案"按钮添加您的第一个认证方案
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={handleCreateScheme}
          >
            创建新方案
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="认证方案表格">
            <TableHead>
              <TableRow>
                <TableCell>方案名称</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>字段数量</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schemes.map((scheme) => (
                <TableRow key={scheme.id} hover>
                  <TableCell component="th" scope="row">
                    {scheme.name}
                  </TableCell>
                  <TableCell>{scheme.description || '无描述'}</TableCell>
                  <TableCell>{(scheme as any).fieldsCount || scheme.fields?.length || 0}</TableCell>
                  <TableCell>
                    <Chip 
                      label={scheme.isActive ? '启用' : '禁用'} 
                      color={scheme.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewScheme(scheme.id)}
                      title="查看详情"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditScheme(scheme.id)}
                      title="编辑方案"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteScheme(scheme.id)}
                      title="删除方案"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </MainLayout>
  );
};

export default AdminSchemeList; 