const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getUserInfo, exchangeCodeForToken } = require('../config/oauth');

// 用户信息缓存 - 使用 Map 存储每个用户的缓存
const userCache = new Map();
const USER_CACHE_DURATION = 3 * 60 * 1000; // 3分钟缓存

// 清除单个用户缓存
const clearUserCache = (userId) => {
  userCache.delete(userId);
};

// OAuth登录回调处理
const handleOAuthCallback = async (req, res) => {
  const { code, access_token, redirect_uri, code_verifier } = req.body;
  
  console.log('Received OAuth callback:', code ? '(有code)' : (access_token ? '(有token)' : '(无凭证)'));
  
  if (!code && !access_token) {
    return res.status(400).json({
      success: false,
      message: '缺少授权码或访问令牌'
    });
  }
  
  try {
    // 从OAuth服务获取用户信息
    let accessToken = access_token;
    if (code) {
      try {
        accessToken = await exchangeCodeForToken(code, redirect_uri, code_verifier);
      } catch (exchangeError) {
        console.error('Token exchange error:', exchangeError.message);
        return res.status(401).json({
          success: false,
          message: exchangeError.response?.data?.message || exchangeError.message || '授权码无效或已过期',
          error: exchangeError.response?.data || exchangeError.responseData || exchangeError.message
        });
      }
    }

    // 从OAuth服务获取用户信息
    const result = await getUserInfo(accessToken);
    
    console.log('OAuth result:', result.success ? 'Success' : 'Failed');
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌',
        error: result.error
      });
    }
    
    const oauthUser = result.user;
    console.log('User info retrieved:', oauthUser.id, oauthUser.username);
    if (!oauthUser.username) { oauthUser.username = '用户' + String(oauthUser.id).slice(-8); }
    
    // 检查用户是否已存在
    let user = await User.findOne({ where: { oauthId: oauthUser.id.toString() } });
    
    // 用户不存在，创建新用户
    if (!user) {
      console.log('Creating new user:', oauthUser.username);
      user = await User.create({
        oauthId: oauthUser.id.toString(),
        username: oauthUser.username,
        email: oauthUser.email,
        avatar: oauthUser.avatar,
        status: 'active',
        lastLogin: new Date()
      });
    } else {
      // 更新用户信息和登录时间
      console.log('Updating existing user:', user.username);
      user.username = oauthUser.username;
      user.email = oauthUser.email;
      user.avatar = oauthUser.avatar;
      user.lastLogin = new Date();
      await user.save();
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: '服务器认证配置错误'
      });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    console.log('Login successful for user:', user.username);
    
    // 清除该用户的缓存，确保返回最新信息
    clearUserCache(user.id);
    
    // 返回用户信息和令牌
    return res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('登录处理错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

// 获取当前用户信息（带缓存优化）
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const now = Date.now();
    
    // 检查缓存
    const cached = userCache.get(userId);
    if (cached && (now - cached.timestamp) < USER_CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        data: cached.user,
        cached: true
      });
    }
    
    // 缓存未命中或已过期，查询数据库
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'avatar', 'isAdmin', 'createdAt', 'lastLogin']
    });
    
    if (!user) {
      // 用户不存在，从缓存中移除
      userCache.delete(userId);
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 将用户信息转为普通对象并缓存
    const userData = user.toJSON();
    userCache.set(userId, {
      user: userData,
      timestamp: now
    });
    
    // 定期清理过期缓存（避免内存泄漏）
    if (userCache.size > 1000) {
      // 如果缓存超过1000个用户，清理过期的
      for (const [key, value] of userCache.entries()) {
        if (now - value.timestamp > USER_CACHE_DURATION) {
          userCache.delete(key);
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

module.exports = {
  handleOAuthCallback,
  getCurrentUser,
  clearUserCache  // 导出以便其他模块在更新用户信息时清除缓存
}; 