import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Container, Paper, alpha, useTheme } from '@mui/material';
import { extractTokenFromHash, validateState } from '../utils/oauth';
import { useAuth } from '../contexts/AuthContext';
import { keyframes } from '@mui/system';

// 定义呼吸动画
const breatheAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const OAuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [logoLoaded, setLogoLoaded] = useState<boolean>(false);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    // 计时器，用于模拟最少的加载时间
    const timer = setInterval(() => {
      setProcessingTime(prev => prev + 1);
    }, 1000);

    const processOAuthCallback = async () => {
      try {
        // 添加延迟，给足够时间显示加载动画
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 从URL hash中提取令牌信息
        const tokenInfo = extractTokenFromHash();
        
        if (!tokenInfo) {
          setError('无法提取访问令牌');
          setLoading(false);
          return;
        }
        
        if (tokenInfo.error) {
          setError(`授权失败: ${tokenInfo.error}`);
          setLoading(false);
          return;
        }
        
        // 验证状态值
        if (!validateState(tokenInfo.state)) {
          setError('状态验证失败，可能存在安全风险');
          setLoading(false);
          return;
        }
        
        // 使用访问令牌登录
        const success = await login(tokenInfo.accessToken);
        
        if (success) {
          // 登录成功，重定向到首页
          navigate('/');
        } else {
          setError('登录失败，请稍后重试');
          setLoading(false);
        }
      } catch (err) {
        console.error('OAuth回调处理错误:', err);
        setError('处理授权响应时出错');
        setLoading(false);
      }
    };

    processOAuthCallback();

    return () => {
      clearInterval(timer);
    };
  }, [login, navigate]);

  // 只有在加载时间超过30秒且有错误时才显示错误（前端回调超时阈值）
  const shouldShowError = error && processingTime > 30;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha('#eff6ff', 0.9)} 0%, ${alpha('#dbeafe', 0.7)} 100%)`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: { xs: 2, md: 4 }
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4
            }}
          >
            <Box
              sx={{
                mb: 4,
                animation: logoLoaded ? `${breatheAnimation} 3s infinite ease-in-out` : 'none',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <img 
                src="/trustlogo.png" 
                alt="信任中心Logo" 
                style={{ 
                  width: '160px', 
                  height: 'auto',
                  borderRadius: '8px'
                }}
                onLoad={() => setLogoLoaded(true)}
              />
            </Box>
            
            {shouldShowError ? (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mt: 2,
                  fontSize: '0.95rem'
                }}
              >
                {error}
              </Alert>
            ) : (
              <>
                <CircularProgress 
                  size={50} 
                  thickness={4}
                  sx={{ 
                    mb: 3,
                    color: theme.palette.primary.main
                  }} 
                />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  正在处理登录请求
                </Typography>
                <Typography 
                  variant="body1" 
                  color="textSecondary"
                  align="center"
                  sx={{ maxWidth: 400 }}
                >
                  正在连接到认证服务器，请耐心等待...
                </Typography>
                {processingTime > 3 && (
                  <Typography 
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 2 }}
                  >
                    {`验证时间可能较长，已等待 ${processingTime} 秒...`}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default OAuthCallback; 