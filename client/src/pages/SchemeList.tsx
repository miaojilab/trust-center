import React, { useEffect, useState } from 'react';
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
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import { kycAPI } from '../services/api';
import { KYCScheme, KYCSubmission } from '../types';
import MainLayout from '../components/layout/MainLayout';

const SchemeList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState<KYCScheme[]>([]);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const navigate = useNavigate();

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

  // 获取认证状态
  const getSubmissionStatus = (schemeId: number) => {
    const submission = submissions.find((s: KYCSubmission) => s.schemeId === schemeId);
    if (!submission) return 'not_submitted';
    // 确保正确返回状态
    return submission.status;
  };

  // 获取状态芯片
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'approved':
        return <Chip label="已认证" color="success" size="small" />;
      case 'pending':
        return <Chip label="待审核" color="warning" size="small" />;
      case 'rejected':
        return <Chip label="未通过" color="error" size="small" />;
      default:
        return <Chip label="未提交" size="small" variant="outlined" />;
    }
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
          认证方案列表
        </Typography>
        <Typography variant="body1" color="text.secondary">
          以下是可用的身份认证方案，请选择合适的方案进行认证。
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="认证方案表格">
          <TableHead>
            <TableRow>
              <TableCell>方案名称</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>所需字段数</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schemes.map((scheme: KYCScheme) => {
              const status = getSubmissionStatus(scheme.id);
              return (
                <TableRow key={scheme.id} hover>
                  <TableCell component="th" scope="row">
                    {scheme.name}
                  </TableCell>
                  <TableCell>{scheme.description || '无描述'}</TableCell>
                  <TableCell>{(scheme as any).fieldsCount || scheme.fields?.length || 0}</TableCell>
                  <TableCell>{getStatusChip(status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/schemes/${scheme.id}`)}
                      >
                        查看详情
                      </Button>
                      {status !== 'approved' && status !== 'pending' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/submit/${scheme.id}`)}
                        >
                          {status === 'rejected' ? '重新提交' : '开始认证'}
                        </Button>
                      )}
                      {status === 'pending' && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate('/status')}
                        >
                          查看进度
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {schemes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  暂无认证方案
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
  );
};

export default SchemeList; 