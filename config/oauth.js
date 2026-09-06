const axios = require('axios');
require('dotenv').config();

// OAuth/OIDC 配置（E时代通行证）
const oauthConfig = {
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3001/oauth/callback',
  authorizationUrl: process.env.OAUTH_AUTHORIZATION_URL || 'https://account.emoera.com/api/oauth2/authorize',
  tokenUrl: process.env.OAUTH_TOKEN_URL || 'https://accountapi.emoera.com/api/oidc/token',
  userInfoUrl: process.env.OAUTH_USERINFO_URL || 'https://accountapi.emoera.com/api/oidc/userinfo',
  scope: process.env.OAUTH_SCOPE || 'openid profile email'
};

if (!oauthConfig.clientId || !oauthConfig.clientSecret) {
  throw new Error('Missing required OAuth environment variables: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET');
}

// 生成 OAuth 授权 URL（授权码模式）
const getAuthorizationUrl = (state, nonce) => {
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    response_type: 'code',
    redirect_uri: oauthConfig.redirectUri,
    scope: oauthConfig.scope,
    state: state || Math.random().toString(36).substring(2, 15),
    nonce: nonce || Math.random().toString(36).substring(2, 18)
  });

  return `${oauthConfig.authorizationUrl}?${params.toString()}`;
};

// 用授权码换取访问令牌
const exchangeCodeForToken = async (code, redirectUri, codeVerifier) => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
    code,
    redirect_uri: redirectUri || oauthConfig.redirectUri
  });

  if (codeVerifier) { params.set('code_verifier', codeVerifier); }

  const response = await axios.post(oauthConfig.tokenUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000
  });

  if (!response.data || !response.data.access_token) {
    const message = response.data?.message || '授权服务未返回访问令牌';
    const error = new Error(message);
    error.responseData = response.data;
    throw error;
  }

  return response.data.access_token;
};

// 获取用户信息（OIDC UserInfo，Bearer 认证）
const getUserInfo = async (accessToken) => {
  try {
    const response = await axios.get(oauthConfig.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 15000
    });

    const data = response.data;
    // 兼容两种返回：标准 OIDC claims，或 { code:200, data:{...} } 包装
    const raw = data && data.code === 200 && data.data ? data.data : data;

    if (!raw || (!raw.sub && !raw.id)) {
      console.log('OAuth UserInfo Error:', data?.message || data?.error || 'invalid userinfo');
      return {
        success: false,
        message: '获取用户信息失败',
        error: data
      };
    }

    return {
      success: true,
      user: {
        id: String(raw.sub ?? raw.id ?? ''),
        username: raw.username || raw.name || raw.nickname || '',
        email: raw.email || '',
        avatar: raw.avatar || raw.avatarUrl || raw.picture || ''
      }
    };
  } catch (error) {
    console.error('OAuth Error:', error.message);

    // 在开发环境中，模拟成功响应以便测试
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Returning mock user data');
      return {
        success: true,
        user: {
          id: '123456',
          username: 'test_user',
          email: 'test@example.com',
          avatar: 'https://via.placeholder.com/150'
        }
      };
    }

    return {
      success: false,
      message: '获取用户信息时发生错误',
      error: error.response?.data || error.message
    };
  }
};

module.exports = {
  oauthConfig,
  getAuthorizationUrl,
  exchangeCodeForToken,
  getUserInfo
};
