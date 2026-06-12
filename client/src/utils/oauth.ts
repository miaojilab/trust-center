// OAuth配置
const oauthConfig = {
  clientId: process.env.REACT_APP_OAUTH_CLIENT_ID || 'trust-center',
  redirectUri: process.env.REACT_APP_OAUTH_REDIRECT_URI || 'https://trust.emoera.com/oauth/callback',
  authorizationEndpoint: process.env.REACT_APP_OAUTH_AUTHORIZATION_ENDPOINT || 'https://account.emoera.com/oauth/authorize'
};

/**
 * 生成OAuth授权URL
 * @param state 状态值，用于防止CSRF攻击
 * @returns 授权URL
 */
export const getAuthorizationUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    response_type: 'token',
    redirect_uri: oauthConfig.redirectUri,
    state: state
  });
  
  return `${oauthConfig.authorizationEndpoint}?${params.toString()}`;
};

/**
 * 从URL的hash参数中提取访问令牌
 * @returns 访问令牌信息
 */
export const extractTokenFromHash = (): { 
  accessToken: string; 
  expiresIn: number; 
  state: string; 
  error?: string 
} | null => {
  // 移除#前缀
  const hash = window.location.hash.substring(1);
  
  if (!hash) {
    return null;
  }
  
  // 解析hash参数
  const params = new URLSearchParams(hash);
  
  // 检查是否存在错误
  if (params.has('error')) {
    return {
      accessToken: '',
      expiresIn: 0,
      state: params.get('state') || '',
      error: params.get('error') || 'unknown_error'
    };
  }
  
  // 提取令牌信息
  return {
    accessToken: params.get('access_token') || '',
    expiresIn: parseInt(params.get('expires_in') || '0', 10),
    state: params.get('state') || ''
  };
};

/**
 * 验证状态值
 * @param state 回调中的状态值
 * @returns 是否验证通过
 */
export const validateState = (state: string): boolean => {
  const savedState = localStorage.getItem('oauth_state');
  
  // 验证完成后清除状态
  localStorage.removeItem('oauth_state');
  
  return savedState === state;
}; 