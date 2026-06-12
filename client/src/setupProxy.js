const { createProxyMiddleware } = require('http-proxy-middleware');

// 尝试加载环境变量
require('dotenv').config();

// 获取API代理目标地址
const apiProxyTarget = process.env.REACT_APP_API_PROXY_TARGET || 'https://trustapi.emoera.com';

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiProxyTarget,
      changeOrigin: true,
    })
  );
}; 