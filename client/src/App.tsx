import React, { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from './routes/AppRoutes';
import baseTheme from './theme';
import { AppearanceContext, AppearanceMode } from './contexts/AppearanceContext';
import './App.css';

function App() {
  const [mode, setMode] = useState<AppearanceMode>(() => {
    try { return localStorage.getItem('trust-appearance') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.dataset.appearance = mode;
    try { localStorage.setItem('trust-appearance', mode); } catch { /* Theme still works if storage is unavailable. */ }
  }, [mode]);
  const theme = useMemo(() => createTheme(baseTheme, {
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#91adff' : '#315edb' },
      success: { main: mode === 'dark' ? '#73d2aa' : '#16805a' },
      warning: { main: mode === 'dark' ? '#ffc078' : '#a86209' },
      error: { main: mode === 'dark' ? '#ff9d9d' : '#c3333e' },
      background: { default: mode === 'dark' ? '#0e1725' : '#f7f8fa', paper: mode === 'dark' ? '#162235' : '#ffffff' },
      text: { primary: mode === 'dark' ? '#edf2fa' : '#172638', secondary: mode === 'dark' ? '#a6b5c8' : '#637184' },
      divider: mode === 'dark' ? '#2a384b' : '#e3e8ee'
    }
  }), [mode]);
  return <AppearanceContext.Provider value={{mode, toggleMode: () => setMode(m => m === 'light' ? 'dark' : 'light')}}><ThemeProvider theme={theme}><CssBaseline/><AppRoutes/></ThemeProvider></AppearanceContext.Provider>;
}
export default App;
