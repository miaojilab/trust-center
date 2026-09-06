import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Card, CardContent, useTheme, TextField, Button, Alert, CircularProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Api as ApiIcon, Security as SecurityIcon, Info as InfoIcon, ExpandMore as ExpandMoreIcon, Send as SendIcon, PlayArrow as TestIcon } from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import axios, { AxiosError } from 'axios';

// API接口类型定义
interface ApiEndpoint {
  method: string;
  endpoint: string;
  description: string;
  authentication: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  responses?: {
    code: string;
    description: string;
    example?: string;
  }[];
}

// 测试响应类型
interface TestResponse {
  status: number;
  statusText: string;
  data: any;
  headers: any;
  error?: string;
}

const ApiDocumentation: React.FC = () => {
  const theme = useTheme();
  const [baseUrl, setBaseUrl] = useState<string>('https://your-api-domain.com');
  const [testResults, setTestResults] = useState<Record<string, TestResponse | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>({});


  const handleBaseUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBaseUrl(event.target.value);
  };

  const handleParamChange = (apiEndpoint: string, paramName: string, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [apiEndpoint]: {
        ...(prev[apiEndpoint] || {}),
        [paramName]: value
      }
    }));
  };

  const handleTest = async (api: ApiEndpoint) => {
    // 设置加载状态
    setLoading((prev) => ({ ...prev, [api.endpoint]: true }));
    
    try {
      let url = `${baseUrl}${api.endpoint}`;
      let config: any = {};
      const currentParams = paramValues[api.endpoint] || {};

      // 处理请求参数
      if (api.method === 'GET') {
        // 对于GET请求，参数添加到URL查询字符串中
        const queryParams = new URLSearchParams();
        api.parameters?.forEach(param => {
          if (currentParams[param.name]) {
            queryParams.append(param.name, currentParams[param.name]);
          }
        });
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      } else {
        // 对于非GET请求，参数放在请求体中
        config.data = {};
        api.parameters?.forEach(param => {
          if (currentParams[param.name]) {
            config.data[param.name] = currentParams[param.name];
          }
        });
      }

      // 发送请求
      const response = await axios({
        method: api.method.toLowerCase(),
        url,
        ...config,
        timeout: 10000,
      });

      // 设置响应结果
      setTestResults((prev) => ({
        ...prev,
        [api.endpoint]: {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers
        }
      }));
    } catch (error) {
      let errorMessage = '请求出错';
      
      if (axios.isAxiosError<any>(error)) {
        const axiosError = error as AxiosError;
        errorMessage = axiosError.message;
        
        setTestResults((prev) => ({
          ...prev,
          [api.endpoint]: {
            status: axiosError.response?.status || 0,
            statusText: axiosError.response?.statusText || '',
            data: axiosError.response?.data || {},
            headers: axiosError.response?.headers || {},
            error: errorMessage
          }
        }));
      } else if (error instanceof Error) {
        errorMessage = error.message;
        setTestResults((prev) => ({
          ...prev,
          [api.endpoint]: {
            status: 0,
            statusText: '',
            data: {},
            headers: {},
            error: errorMessage
          }
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [api.endpoint]: {
            status: 0,
            statusText: '',
            data: {},
            headers: {},
            error: '未知错误'
          }
        }));
      }
    } finally {
      setLoading((prev) => ({ ...prev, [api.endpoint]: false }));
    }
  };

  // 定义API接口列表
  const apiEndpoints: ApiEndpoint[] = [
    {
      method: 'GET',
      endpoint: '/api/verification/status',
      description: '查询用户认证状态',
      authentication: '不需要',
      parameters: [
        {
          name: 'oauthId',
          type: 'string',
          required: true,
          description: '用户的OAuth ID'
        },
        {
          name: 'schemeId',
          type: 'number',
          required: true,
          description: '认证方案ID'
        }
      ],
      responses: [
        {
          code: '200',
          description: '成功',
          example: JSON.stringify({
            success: true,
            data: {
              verified: true,
              status: 'approved',
              timestamp: '2023-10-20T14:30:45Z'
            }
          }, null, 2)
        },
        {
          code: '400',
          description: '参数错误',
          example: JSON.stringify({
            success: false,
            message: '缺少必要参数'
          }, null, 2)
        },
        {
          code: '404',
          description: '用户或方案不存在',
          example: JSON.stringify({
            success: false,
            message: '用户未找到或方案不存在'
          }, null, 2)
        }
      ]
    },
    {
      method: 'GET',
      endpoint: '/api/verification/details',
      description: '查询用户认证详情',
      authentication: '需要API密钥',
      parameters: [
        {
          name: 'oauthId',
          type: 'string',
          required: true,
          description: '用户的OAuth ID'
        },
        {
          name: 'schemeId',
          type: 'number',
          required: true,
          description: '认证方案ID'
        },
        {
          name: 'apiKey',
          type: 'string',
          required: true,
          description: 'API密钥'
        }
      ],
      responses: [
        {
          code: '200',
          description: '成功',
          example: JSON.stringify({
            success: true,
            data: {
              verified: true,
              status: 'approved',
              submittedAt: '2023-10-18T09:15:30Z',
              approvedAt: '2023-10-20T14:30:45Z',
              details: {
                name: '张三',
                idNumber: '310*********1234',
                verificationLevel: 'advanced'
              }
            }
          }, null, 2)
        },
        {
          code: '400',
          description: '参数错误',
          example: JSON.stringify({
            success: false,
            message: '缺少必要参数'
          }, null, 2)
        },
        {
          code: '401',
          description: 'API密钥无效',
          example: JSON.stringify({
            success: false,
            message: 'API密钥无效'
          }, null, 2)
        },
        {
          code: '404',
          description: '用户或方案不存在',
          example: JSON.stringify({
            success: false,
            message: '用户未找到或方案不存在'
          }, null, 2)
        }
      ]
    }
  ];

  const renderApiDetails = (api: ApiEndpoint) => {
    const testResult = testResults[api.endpoint];
    const isLoading = loading[api.endpoint] || false;
    const values = paramValues[api.endpoint] || {};

    return (
      <Card sx={{ mb: 4, overflow: 'visible' }} key={api.endpoint}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Chip 
              label={api.method} 
              color={api.method === 'GET' ? 'info' : 'warning'} 
              sx={{ fontWeight: 'bold', mr: 2 }} 
            />
            <Typography variant="h6" component="div" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {api.endpoint}
            </Typography>
          </Box>
          
          <Typography color="text.secondary" gutterBottom>
            {api.description}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
            <SecurityIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
            <Typography variant="body2" color="text.secondary">
              认证方式: {api.authentication}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            请求参数
          </Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                  <TableCell>参数名</TableCell>
                  <TableCell>类型</TableCell>
                  <TableCell>必填</TableCell>
                  <TableCell>描述</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {api.parameters?.map((param) => (
                  <TableRow key={param.name}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{param.name}</TableCell>
                    <TableCell>{param.type}</TableCell>
                    <TableCell>
                      {param.required ? (
                        <Chip label="是" size="small" color="primary" variant="outlined" />
                      ) : (
                        <Chip label="否" size="small" color="default" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{param.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            响应说明
          </Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                  <TableCell width="15%">状态码</TableCell>
                  <TableCell width="85%">描述</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {api.responses?.map((response) => (
                  <TableRow key={response.code}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{response.code}</TableCell>
                    <TableCell>{response.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {api.responses?.map((response) => (
            response.example && (
              <Box key={response.code} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  示例响应 ({response.code})
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    backgroundColor: theme.palette.background.default,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}
                >
                  <pre style={{ margin: 0 }}>{response.example}</pre>
                </Paper>
              </Box>
            )
          ))}

          {/* 测试接口部分 */}
          <Accordion sx={{ mt: 3 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="test-panel-content"
              id="test-panel-header"
              sx={{ 
                bgcolor: theme.palette.primary.main, 
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TestIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle1">测试此接口</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  参数设置
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                  {api.parameters?.map((param) => (
                    <TextField
                      key={param.name}
                      label={`${param.name}${param.required ? ' *' : ''}`}
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={values[param.name] || ''}
                      onChange={(e) => handleParamChange(api.endpoint, param.name, e.target.value)}
                      required={param.required}
                      helperText={param.description}
                    />
                  ))}
                </Box>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => handleTest(api)}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? '请求中...' : '发送请求'}
                </Button>
                
                {testResult && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      响应结果
                    </Typography>
                    
                    {testResult.error ? (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        错误: {testResult.error}
                      </Alert>
                    ) : (
                      <Alert 
                        severity={testResult.status >= 200 && testResult.status < 300 ? "success" : "warning"}
                        sx={{ mb: 2 }}
                      >
                        状态: {testResult.status} {testResult.statusText}
                      </Alert>
                    )}
                    
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: theme.palette.background.default,
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        overflow: 'auto',
                        maxHeight: '300px'
                      }}
                    >
                      <pre style={{ margin: 0 }}>
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <ApiIcon fontSize="large" sx={{ mr: 1 }} />
          API文档
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            接口概述
          </Typography>
          <Typography paragraph>
            本文档提供了KYC认证中心外部API的详细说明。这些API允许第三方应用查询用户的认证状态和详细信息。
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: theme.palette.info.light, color: theme.palette.info.contrastText, borderRadius: 1, mb: 2 }}>
            <InfoIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              所有API请求均使用标准JSON格式返回数据，通过success字段标识请求是否成功。
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            基础URL
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={baseUrl}
            onChange={handleBaseUrlChange}
            sx={{ mb: 2, fontFamily: 'monospace' }}
            placeholder="输入API的基础URL"
            label="基础URL"
          />
          
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            认证方式
          </Typography>
          <Typography paragraph>
            部分API需要通过API密钥进行认证。API密钥可通过管理员账户在控制台中创建和管理。
          </Typography>
        </Paper>
        
        <Typography variant="h5" sx={{ mb: 2 }}>
          API接口
        </Typography>
        
        {apiEndpoints.map(api => renderApiDetails(api))}
      </Box>
    </MainLayout>
  );
};

export default ApiDocumentation; 