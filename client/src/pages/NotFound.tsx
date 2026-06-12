import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 3
      }}
    >
      <Paper
        sx={{
          p: 5,
          maxWidth: 500,
          textAlign: 'center'
        }}
        elevation={3}
      >
        <Typography variant="h1" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ mb: 3 }}>
          页面未找到
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          您访问的页面不存在或已被移除。请检查URL是否正确，或返回首页。
        </Typography>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          size="large"
        >
          返回首页
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound; 