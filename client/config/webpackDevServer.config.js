/**
 * Webpack开发服务器配置覆盖
 */
const dotenv = require('dotenv');
dotenv.config();

// 获取API基础URL（不包含'/api'部分）
const apiProxyTarget = process.env.REACT_APP_API_PROXY_TARGET || 'http://localhost:3000';

module.exports = function(proxy, allowedHost) {
  return {
    // 允许访问的主机
    allowedHosts: 'all',
    
    // 禁用主机检查
    disableHostCheck: true,
    
    // 启用热重载
    hot: true,
    
    // 设置开发服务器
    devServer: {
      port: 3001,
      historyApiFallback: true,
      proxy: {
        '/api': apiProxyTarget
      }
    }
  };
}; 