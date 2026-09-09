import { createTheme } from '@mui/material/styles';
import { zhCN } from '@mui/material/locale';

// 创建自定义主题
const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#2563eb',
        light: '#60a5fa',
        dark: '#1d4ed8',
      },
      secondary: {
        main: '#475569',
        light: '#64748b',
        dark: '#334155',
      },
      error: {
        main: '#dc2626',
        light: '#f87171',
        dark: '#b91c1c',
      },
      warning: {
        main: '#d97706',
        light: '#f59e0b',
        dark: '#b45309',
      },
      info: {
        main: '#2563eb',
        light: '#60a5fa',
        dark: '#1d4ed8',
      },
      success: {
        main: '#16805a',
        light: '#34a574',
        dark: '#116044',
      },
      background: {
        default: '#f5f9fa',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            '&:last-child': {
              paddingBottom: 16,
            },
          },
        },
      },
    },
  },
  zhCN // 提供中文语言支持
);

export default theme; 