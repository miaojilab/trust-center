import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Divider, Alert, CircularProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import MainLayout from '../../components/layout/MainLayout';
import { KYCScheme } from '../../types';

const AdminSchemeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState<KYCScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载方案详情
  useEffect(() => {
    const fetchScheme = async () => {
      if (!id) {
        setError('无效的方案ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await adminAPI.getSchemeById(parseInt(id));
        if (response.success && response.data) {
          // 确保正确处理status字段
          const schemeData = {
            ...response.data,
            isActive: response.data.status === 'active'
          };
          setScheme(schemeData);
        } else {
          setError(response.message || '加载方案详情失败');
        }
      } catch (error) {
        console.error('加载方案详情失败:', error);
        setError('无法加载认证方案详情');
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [id]);

  // 返回列表
  const handleBack = () => {
    navigate('/admin/schemes');
  };

  // 编辑方案
  const handleEdit = () => {
    navigate(`/admin/schemes/edit/${id}`);
  };

  // 获取字段类型中文名称
  const getFieldTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      text: '文本',
      email: '电子邮件',
      phone: '电话号码',
      date: '日期',
      select: '选择框',
      image: '图片上传',
      file: '文件上传'
    };
    return typeMap[type] || type;
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

  if (error || !scheme) {
    return (
      <MainLayout>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            方案详情
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || '未找到方案'}
        </Alert>
        <Button variant="outlined" startIcon={<BackIcon />} onClick={handleBack}>
          返回列表
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          方案详情
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          color="primary"
        >
          编辑方案
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            基本信息
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" fontWeight="bold" sx={{ mr: 2 }}>
              方案名称:
            </Typography>
            <Typography variant="body1">
              {scheme.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="body1" fontWeight="bold" sx={{ mr: 2 }}>
              方案描述:
            </Typography>
            <Typography variant="body1">
              {scheme.description || '无描述'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" fontWeight="bold" sx={{ mr: 2 }}>
              状态:
            </Typography>
            <Chip
              label={scheme.isActive ? '启用' : '禁用'}
              color={scheme.isActive ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" fontWeight="bold" sx={{ mr: 2 }}>
              创建时间:
            </Typography>
            <Typography variant="body1">
              {scheme.createdAt ? new Date(scheme.createdAt).toLocaleString() : '未知'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          字段配置 ({scheme.fields?.length || 0}个字段)
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>序号</TableCell>
                <TableCell>标签</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>必填</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>选项</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scheme.fields && scheme.fields.map((field, index) => (
                <TableRow key={field.id || index} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{field.label}</TableCell>
                  <TableCell>{getFieldTypeName(field.type)}</TableCell>
                  <TableCell>
                    {field.required ? (
                      <Chip label="必填" size="small" color="primary" />
                    ) : (
                      <Chip label="选填" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{field.description || '无'}</TableCell>
                  <TableCell>
                    {field.type === 'select' && field.options && field.options.length > 0 ? (
                      <Box>
                        {field.options.map((option, i) => (
                          <Chip
                            key={i}
                            label={option}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    ) : (
                      '无'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </MainLayout>
  );
};

export default AdminSchemeDetail; 