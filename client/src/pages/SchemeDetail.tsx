import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  FileCopy as DocumentIcon,
  ArrowBack as BackIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { kycAPI } from '../services/api';
import { KYCScheme, KYCField, KYCSubmission } from '../types';
import MainLayout from '../components/layout/MainLayout';

const SchemeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheme, setScheme] = useState<KYCScheme | null>(null);
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('无效的方案ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 并行获取数据：方案详情和初始数据
        const [schemeResponse, initialDataResponse] = await Promise.all([
          kycAPI.getSchemeById(parseInt(id)),
          kycAPI.getInitialData()
        ]);

        if (schemeResponse.success && schemeResponse.data) {
          // 确保所有字段的name属性都是唯一的
          const uniqueFields = schemeResponse.data.fields?.map((field: KYCField, index: number) => {
            // 如果字段没有name或name为空，则使用id或生成一个唯一名称
            if (!field.name || field.name.trim() === '') {
              return {
                ...field,
                name: field.id || `field_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
              };
            }
            return field;
          });
          
          // 检查是否有重复的name属性
          const nameFrequency: Record<string, number> = {};
          
          uniqueFields.forEach((field: KYCField) => {
            if (nameFrequency[field.name]) {
              nameFrequency[field.name]++;
            } else {
              nameFrequency[field.name] = 1;
            }
          });
          
          // 如果有重复名称，为其添加后缀确保唯一性
          const deduplicatedFields = uniqueFields.map((field: KYCField) => {
            if (nameFrequency[field.name] > 1) {
              // 如果是重复名称，添加一个唯一的后缀
              const newName = `${field.name}_${field.id || Date.now().toString(36)}`;
              return { ...field, name: newName };
            }
            return field;
          });
          
          // 更新方案数据
          const updatedScheme = {
            ...schemeResponse.data,
            fields: deduplicatedFields
          };
          
          setScheme(updatedScheme);
        } else {
          setError('获取认证方案详情失败');
        }

        if (initialDataResponse.success && initialDataResponse.data) {
          // 处理用户状态数据，确保正确获取schemeId
          const processedSubmissions = initialDataResponse.data.userStatus.map(sub => ({
            ...sub,
            schemeId: sub.KYCScheme?.id || sub.schemeId
          }));
          
          // 查找当前方案的提交记录
          const userSubmission = processedSubmissions.find(s => s.schemeId === parseInt(id));
          if (userSubmission) {
            setSubmission(userSubmission);
          }
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        setError('加载数据时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 获取状态芯片
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'approved':
        return <Chip icon={<CheckIcon />} label="已认证" color="success" />;
      case 'pending':
        return <Chip label="待审核" color="warning" />;
      case 'rejected':
        return <Chip label="未通过" color="error" />;
      default:
        return <Chip label="未提交" variant="outlined" />;
    }
  };

  // 获取字段类型中文名称
  const getFieldTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      text: '文本',
      email: '邮箱',
      number: '数字',
      date: '日期',
      select: '选择',
      file: '文件'
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || '找不到指定的认证方案'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/schemes')}
        >
          返回方案列表
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Breadcrumbs aria-label="面包屑" sx={{ mb: 3 }}>
        <Link color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
          首页
        </Link>
        <Link color="inherit" onClick={() => navigate('/schemes')} sx={{ cursor: 'pointer' }}>
          认证方案
        </Link>
        <Typography color="text.primary">{scheme.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {scheme.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {scheme.description || '无描述'}
          </Typography>
        </Box>
        <Box>
          {submission ? (
            <>
              {getStatusChip(submission.status)}
              {submission.status === 'approved' && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  您已完成此认证方案
                </Typography>
              )}
              {submission.status === 'pending' && (
                <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                  您的认证申请正在审核中
                </Typography>
              )}
              {submission.status === 'rejected' && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  拒绝原因: {submission.rejectReason || '无'}
                </Typography>
              )}
            </>
          ) : (
            getStatusChip('not_submitted')
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          需要提供的信息
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <List>
          {scheme.fields && scheme.fields.length > 0 ? (
            scheme.fields.map((field: KYCField, index: number) => (
              <React.Fragment key={`field-${index}-${field.id || field.name}`}>
                {index > 0 && <Divider component="li" />}
                <ListItem>
                  <ListItemIcon>
                    <DocumentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={field.label}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          类型: {getFieldTypeName(field.type)}
                          {field.required && ' (必填)'}
                        </Typography>
                        {field.description && (
                          <Typography component="div" variant="body2">
                            {field.description}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="此认证方案未定义所需字段" />
            </ListItem>
          )}
        </List>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/schemes')}
        >
          返回列表
        </Button>
        
        {(submission?.status !== 'approved' && submission?.status !== 'pending') && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/submit/${scheme.id}`)}
          >
            {submission?.status === 'rejected' ? '重新提交' : '开始认证'}
          </Button>
        )}
        
        {submission?.status === 'pending' && (
          <Button
            variant="outlined"
            onClick={() => navigate('/status')}
          >
            查看状态
          </Button>
        )}
      </Box>
    </MainLayout>
  );
};

export default SchemeDetail; 