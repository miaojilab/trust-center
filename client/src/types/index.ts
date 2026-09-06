// 用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  lastLogin?: string;
  createdAt?: string;
}

// 认证方案类型
export interface KYCScheme {
  id: number;
  name: string;
  description: string;
  fields: KYCField[];
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  fieldNameMap?: Record<string, string>;
}

// KYC字段定义
export interface KYCField {
  id?: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'file' | 'image' | 'phone' | 'longText';
  required: boolean;
  options?: string[];
  description?: string;
  validations?: Record<string, unknown>;
  fieldType?: string;
  originalName?: string;
}

// KYC字段值
export interface KYCFieldValue {
  id: string;
  fieldId: string;
  fieldType: string;
  value: string;
  label: string;
}

// 审核历史记录
export interface ReviewHistory {
  id: string;
  status: 'approved' | 'rejected' | 'pending';
  reviewerId?: number;
  reviewerName?: string;
  reason?: string;
  createdAt: string;
}

// KYC提交信息
export interface KYCSubmission {
  id: string;
  userId: number;
  schemeId: number;
  data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  reviewerId?: number;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  KYCScheme?: {
    id: number;
    name: string;
    fields: KYCField[];
  };
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    createdAt?: string;
    lastLogin?: string;
  };
  User?: User;
  fieldValues?: KYCFieldValue[];
  history?: ReviewHistory[];
}

// API响应格式
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: unknown;
}

// 认证状态检查结果
export interface VerificationStatus {
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
}

// 认证详情
export interface VerificationDetails {
  user: {
    id: number;
    username: string;
    email: string;
  };
  scheme: {
    id: number;
    name: string;
  };
  verificationData: Record<string, unknown>;
  verifiedAt: string;
}

// 初始数据（组合接口返回）
export interface InitialData {
  schemes: KYCScheme[];
  userStatus: KYCSubmission[];
}

// 身份认证上下文
export interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  loading: boolean;
  login: (code: string, codeVerifier?: string) => Promise<boolean>;
  logout: () => void;
} 