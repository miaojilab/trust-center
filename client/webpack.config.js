const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// 获取API基础URL（不包含'/api'部分）
const apiProxyTarget = process.env.REACT_APP_API_PROXY_TARGET || 'https://trustapi.emoera.com';

module.exports = {
  devServer: {
    port: 3001,
    historyApiFallback: true,
    allowedHosts: 'all',
    proxy: {
      '/api': apiProxyTarget
    }
  }
}; 