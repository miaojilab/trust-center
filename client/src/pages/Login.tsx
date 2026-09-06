import React, { useState } from 'react';
import { Box, Button, Typography, Container, useTheme, alpha, Stack, CircularProgress } from '@mui/material';
import { getAuthorizationUrl, generatePkceChallenge } from '../utils/oauth';
import { keyframes } from '@mui/system';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityShieldCanvas from '../components/SecurityShieldCanvas';

// 定义动画
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
`;


// 添加缩放呼吸动画
const breathe = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleOAuthLogin = async () => {
    // 设置加载状态
    setLoading(true);
    
    // 生成随机状态值，防止CSRF攻击
    const state = Math.random().toString(36).substring(2, 15);
    
    // 保存state到本地存储，以便回调时验证
    localStorage.setItem('oauth_state', state);
    
        // 生成 PKCE code_verifier / code_challenge（S256）
    const { verifier, challenge } = await generatePkceChallenge();

    // 保存 code_verifier，回调时用于换取访问令牌
    localStorage.setItem('oauth_code_verifier', verifier);

    // 获取OAuth授权URL
    const authUrl = getAuthorizationUrl(state, challenge);
    
    // 添加短暂延迟，让用户看到加载状态
    setTimeout(() => {
    // 重定向到OAuth授权页面
    window.location.href = authUrl;
    }, 500);
  };

  return (
      <Box
        sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha('#e8f5fe', 0.9)} 0%, ${alpha('#bbdefb', 0.7)} 100%)`,
          display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: { xs: 2, md: 4 }
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative' }}>
        {/* Logo部分已移除，改为在手机端内部显示 */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }}
          sx={{ 
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: `${fadeIn} 0.8s ease-out forwards`
          }}
        >
          {/* 左侧图形部分 */}
          <Box 
            sx={{ 
              background: theme.palette.primary.main,
              display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
              justifyContent: 'center',
          alignItems: 'center',
              padding: 6,
              position: 'relative',
              overflow: 'hidden',
              width: { md: '50%' },
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '150%',
                height: '150%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.light, 0.7)} 100%)`,
                top: '-25%',
                left: '-25%',
                zIndex: 0
              }
            }}
          >
            <Box 
              sx={{ 
                position: 'relative', 
                zIndex: 1,
                textAlign: 'center'
              }}
            >
              <Box sx={{ mb: 4, height: 180, display: 'flex', justifyContent: 'center' }}>
                <SecurityShieldCanvas width={180} height={180} />
              </Box>

              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'white',
                  fontWeight: 700,
                  mb: 2
                }}
              >
                安全可信的认证体系
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: alpha('#fff', 0.8),
                  maxWidth: 300,
                  mx: 'auto'
        }}
      >
                专业、规范、可信的电子认证服务，为您的数字资产保驾护航
              </Typography>
            </Box>
          </Box>

          {/* 右侧登录部分 */}
          <Box
          sx={{
              bgcolor: '#fff',
              padding: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              width: { xs: '100%', md: '50%' }
            }}
          >
            {/* 手机端显示logo - 替换之前的安全动画组件 */}
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                justifyContent: 'center',
                alignItems: 'center',
                mb: 4,
                width: '100%',
                animation: `${breathe} 3s ease-in-out infinite`
              }}
            >
              <img 
                src="/trustlogo.png" 
                alt="E时代信任中心Logo" 
                style={{ 
                  width: 'auto',
                  height: 120,
                  maxWidth: '100%',
                  borderRadius: '20%'
                }}
              />
            </Box>
            
            <Box 
              sx={{ 
                width: '100%',
                maxWidth: 360,
                textAlign: 'center',
                mt: { xs: 2, md: 2 },
                mb: { xs: 3, md: 4 }
              }}
        >
              <Typography 
                component="h1" 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  color: theme.palette.primary.main
                }}
              >
            E时代信任中心
          </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ mb: 4 }}
              >
                欢迎使用统一认证服务，安全便捷地访问平台资源
          </Typography>
          
          <Button
            variant="contained"
            size="large"
                startIcon={loading ? null : <LockOutlinedIcon />}
            onClick={handleOAuthLogin}
                disabled={loading}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 600,
                  letterSpacing: 1,
                  boxShadow: 4,
                  animation: loading ? 'none' : `${pulse} 2s infinite`,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s'
                  },
                  position: 'relative'
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress 
                      size={24} 
                      sx={{ 
                        position: 'absolute',
                        left: 'calc(50% - 12px)',
                        color: 'white'
                      }} 
                    />
                    <span style={{ visibility: 'hidden' }}>E时代通行证一键登录</span>
                  </>
                ) : (
                  'E时代通行证一键登录'
                )}
          </Button>
            </Box>

            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                textAlign: 'center'
              }}
            >
              © {new Date().getFullYear()} E时代信任中心 | 安全可靠的认证服务
            </Typography>
      </Box>
        </Stack>
    </Container>
    </Box>
  );
};

export default Login; 