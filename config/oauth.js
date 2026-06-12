const axios = require('axios');
require('dotenv').config();

// OAuth配置
const oauthConfig = {
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3001/oauth/callback',
  userInfoUrl: process.env.OAUTH_USERINFO_URL || 'https://accountapi.emoera.com/api/oauth2/userinfo',
  authorizationUrl: process.env.OAUTH_AUTHORIZATION_URL || 'https://account.emoera.com/oauth/authorize'
};

if (!oauthConfig.clientId || !oauthConfig.clientSecret) {
  throw new Error('Missing required OAuth environment variables: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET');
}

// 生成OAuth授权URL
const getAuthorizationUrl = (state) => {
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    response_type: 'token',
    redirect_uri: oauthConfig.redirectUri,
    state: state || Math.random().toString(36).substring(2, 15)
  });
  
  return `${oauthConfig.authorizationUrl}?${params.toString()}`;
};

// 获取用户信息
const getUserInfo = async (accessToken) => {
  try {
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      access_token: accessToken
    });
    
    const response = await axios.get(`${oauthConfig.userInfoUrl}?${params.toString()}`);
    
    if (response.data.code === 200) {
      return {
        success: true,
        user: response.data.data
      };
    } else {
      console.log('OAuth Response Error:', response.data?.message || response.data?.code || 'unknown error');
      return {
        success: false,
        message: '获取用户信息失败',
        error: response.data
      };
    }
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
  getUserInfo
}; 