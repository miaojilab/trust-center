import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authAPI } from '../services/api';

// 创建认证上下文
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {}
});

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载用户信息
  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token无效，清除本地存储
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadUser();
  }, []);

  // 登录方法
  const login = useCallback(async (code: string, codeVerifier?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await authAPI.handleCallback(code, codeVerifier);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // 保存token到本地存储
        localStorage.setItem('token', token);
        
        // 设置用户信息
        setUser(user);
        setLoading(false);
        return true;
      } else {
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      setLoading(false);
      return false;
    }
  }, []);

  // 登出方法
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // 上下文值
  const contextValue: AuthContextType = {
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，方便使用认证上下文
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 