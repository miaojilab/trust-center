const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 验证JWT Token中间件
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '无访问权限，请先登录' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.isAdmin = decoded.isAdmin; // 从token中提取isAdmin，避免后续查询数据库
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '令牌无效或已过期' 
    });
  }
};

// 验证管理员权限中间件
const verifyAdmin = (req, res, next) => {
  // 从JWT token中读取isAdmin，避免每次都查询数据库
  // 注意：verifyToken中间件必须先执行，已将isAdmin存入req对象
  if (!req.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: '权限不足，需要管理员权限' 
    });
  }
  
  next();
};

// 验证API访问密钥
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'API密钥缺失' 
    });
  }

  // 支持多个API密钥，从环境变量中获取并以逗号分隔
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',').map(k => k.trim()) : [];
  
  // 同时兼容旧的单个API_KEY环境变量配置
  if (process.env.API_KEY) {
    validApiKeys.push(process.env.API_KEY.trim());
  }
  
  // 检查提供的apiKey是否在有效的密钥列表中
  if (validApiKeys.length > 0 && validApiKeys.includes(apiKey)) {
    next();
  } else {
    return res.status(401).json({ 
      success: false, 
      message: 'API密钥无效' 
    });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyApiKey
}; 