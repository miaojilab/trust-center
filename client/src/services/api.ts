import axios from 'axios';
import { ApiResponse, User, KYCScheme, KYCSubmission, VerificationStatus, VerificationDetails, KYCField, InitialData } from '../types';

// 创建API实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  // 确保请求包含凭证（cookie等）
  withCredentials: true
});

// 请求拦截器：添加token到请求头
api.interceptors.request.use(
  (config) => {
    console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data) {
      console.log('Request data:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器：处理常见错误
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // 服务器响应了，但状态码不在2xx范围内
      console.error(`API Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Error data:', error.response.data);
      
      // 处理401错误（身份验证问题）
      if (error.response.status === 401) {
        console.log('身份验证失败，可能需要重新登录');
        // 可以在这里自动重定向到登录页面
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('API Error: No response received');
    } else {
      // 在设置请求时发生错误
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // OAuth回调处理
  handleCallback: (accessToken: string): Promise<ApiResponse<{ token: string; user: User }>> => 
    api.post('/auth/callback', { access_token: accessToken }).then(res => res.data),
  
  // 获取当前用户信息
  getCurrentUser: (): Promise<ApiResponse<User>> => 
    api.get('/user').then(res => res.data)
};

// KYC API
export const kycAPI = {
  // 获取初始数据（方案列表 + 用户状态）- 组合接口，性能更优
  getInitialData: (): Promise<ApiResponse<InitialData>> => 
    api.get('/kyc/initial-data').then(res => res.data),
  
  // 获取所有KYC方案
  getAllSchemes: (): Promise<ApiResponse<KYCScheme[]>> => 
    api.get('/kyc/schemes').then(res => res.data),
  
  // 获取单个KYC方案
  getSchemeById: (id: number): Promise<ApiResponse<KYCScheme>> => 
    api.get(`/kyc/schemes/${id}`).then(res => res.data),
  
  // 提交KYC数据
  submitKYC: (schemeId: number, data: Record<string, unknown>): Promise<ApiResponse<unknown>> => 
    api.post('/kyc/submit', { schemeId, data }).then(res => res.data),
  
  // 获取用户KYC状态
  getKYCStatus: (): Promise<ApiResponse<KYCSubmission[]>> => 
    api.get('/kyc/status').then(res => res.data)
};

interface UserQueryParams {
  userId?: number;
  username?: string;
  email?: string;
}

// Admin API
export const adminAPI = {
  // 获取待审核KYC列表
  getPendingSubmissions: (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<ApiResponse<{ items: KYCSubmission[]; total: number }>> => 
    api.get('/admin/kyc/pending', { params }).then(res => res.data),
  
  // 审核KYC提交
  reviewSubmission: (submissionId: number, status: 'approved' | 'rejected', rejectReason?: string): Promise<ApiResponse<unknown>> => 
    api.post(`/admin/kyc/review/${submissionId}`, { status, rejectReason }).then(res => res.data),
  
  // 创建新的KYC方案
  createScheme: (name: string, description: string, fields: Omit<KYCField, 'id'>[]): Promise<ApiResponse<KYCScheme>> => 
    api.post('/admin/kyc/schemes', { name, description, fields }).then(res => res.data),
  
  // 获取所有KYC方案
  getSchemes: (): Promise<ApiResponse<KYCScheme[]>> => 
    api.get('/admin/kyc/schemes').then(res => res.data),
  
  // 获取单个KYC方案详情
  getSchemeById: (id: number): Promise<ApiResponse<KYCScheme>> => 
    api.get(`/admin/kyc/schemes/${id}`).then(res => res.data),
  
  // 更新KYC方案
  updateScheme: (id: number, name: string, description: string, fields: KYCField[], isActive?: boolean): Promise<ApiResponse<KYCScheme>> => 
    api.put(`/admin/kyc/schemes/${id}`, { name, description, fields, isActive }).then(res => res.data),
  
  // 删除KYC方案
  deleteScheme: (id: number): Promise<ApiResponse<unknown>> => 
    api.delete(`/admin/kyc/schemes/${id}`).then(res => res.data),
  
  // 获取单个提交记录详情
  getSubmission: (submissionId: string): Promise<ApiResponse<KYCSubmission>> =>
    api.get(`/admin/kyc/submissions/${submissionId}`).then(res => res.data),
    
  // 批准KYC提交
  approveSubmission: (submissionId: string): Promise<ApiResponse<unknown>> =>
    api.post(`/admin/kyc/review/${submissionId}/approve`).then(res => res.data),
    
  // 拒绝KYC提交
  rejectSubmission: (submissionId: string, data: { reason: string }): Promise<ApiResponse<unknown>> =>
    api.post(`/admin/kyc/review/${submissionId}/reject`, data).then(res => res.data),

  // 获取管理员仪表盘统计数据
  getDashboardStats: (): Promise<ApiResponse<any>> => 
    api.get('/admin/dashboard/stats').then(res => res.data),
    
  // 根据方案ID获取所有提交记录
  getSubmissionsByScheme: (schemeId: number): Promise<ApiResponse<KYCSubmission[]>> =>
    api.get('/admin/kyc/pending', { params: { limit: 100, status: '' } }).then(res => res.data)
    .then(response => {
      // 在前端进行筛选，确保只返回指定方案的记录
      const items = response.data?.items || [];
      const filteredItems = items.filter((submission: KYCSubmission) => 
        submission.schemeId === schemeId || 
        submission.KYCScheme?.id === schemeId
      );
      return {
        success: response.success,
        message: response.message,
        data: filteredItems
      };
    }),
    
  // 根据用户信息获取所有提交记录
  getSubmissionsByUser: (queryParams: UserQueryParams): Promise<ApiResponse<KYCSubmission[]>> =>
    api.get('/admin/kyc/pending', { params: { limit: 100, status: '' } }).then(res => res.data)
    .then(response => {
      // 在前端进行筛选，确保只返回符合条件的用户记录
      const items = response.data?.items || [];
      const filteredItems = items.filter((submission: KYCSubmission) => {
        // 按用户ID筛选
        if (queryParams.userId && (submission.userId === queryParams.userId || submission.User?.id === queryParams.userId)) {
          return true;
        }
        
        // 按用户名筛选（不区分大小写）
        if (queryParams.username && submission.User?.username && 
            submission.User.username.toLowerCase().includes(queryParams.username.toLowerCase())) {
          return true;
        }
        
        // 按邮箱筛选（不区分大小写）
        if (queryParams.email && submission.User?.email && 
            submission.User.email.toLowerCase().includes(queryParams.email.toLowerCase())) {
          return true;
        }
        
        return false;
      });
      
      return {
        success: response.success,
        message: response.message,
        data: filteredItems
      };
    }),
    
  // 获取所有用户
  getAllUsers: (): Promise<ApiResponse<User[]>> =>
    api.get('/admin/kyc/pending', { params: { limit: 100, status: '' } }).then(res => res.data)
    .then(response => {
      // 从提交记录中提取不重复的用户信息
      const submissionsWithUsers = response.data?.items || [];
      const userMap = new Map();
      submissionsWithUsers.forEach((submission: KYCSubmission) => {
        if (submission.User && !userMap.has(submission.User.id)) {
          userMap.set(submission.User.id, submission.User);
        }
      });
      return {
        success: response.success,
        message: response.message,
        data: Array.from(userMap.values())
      };
    })
};

// 用户API
export const userAPI = {
  // 获取用户提交记录详情
  getSubmissionDetails: (submissionId: string): Promise<ApiResponse<KYCSubmission>> =>
    api.get(`/user/submissions/${submissionId}`).then(res => res.data),
    
  // 获取用户提交记录（根据ID）
  getSubmissionById: (submissionId: string): Promise<ApiResponse<KYCSubmission>> =>
    api.get(`/user/submissions/${submissionId}`).then(res => res.data),
    
  // 获取用户所有提交记录
  getUserSubmissions: (): Promise<ApiResponse<KYCSubmission[]>> =>
    api.get('/user/submissions').then(res => res.data)
};

// 公共API（无需授权）
export const publicAPI = {
  // 检查用户认证状态
  checkVerificationStatus: (oauthId: string, schemeId: number): Promise<ApiResponse<VerificationStatus>> => 
    api.get(`/verification/status?oauthId=${oauthId}&schemeId=${schemeId}`).then(res => res.data),
  
  // 获取用户认证详情
  getVerificationDetails: (oauthId: string, schemeId: number, apiKey: string): Promise<ApiResponse<VerificationDetails>> => 
    api.get(`/verification/details?oauthId=${oauthId}&schemeId=${schemeId}`, {
      headers: { 'x-api-key': apiKey }
    }).then(res => res.data)
}; 