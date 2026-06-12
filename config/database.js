require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Sequelize } = require('sequelize');

const requiredEnv = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 30,          // 增加最大连接数
      min: 5,           // 设置最小连接数，保持连接池预热
      acquire: 60000,   // 获取连接的最大等待时间
      idle: 10000,      // 减少空闲超时时间，更快释放不用的连接
      evict: 10000      // 连接池检查和移除空闲连接的间隔
    },
    dialectOptions: {
      connectTimeout: 10000  // 连接超时设置
    },
    // 启用查询缓存和优化
    benchmark: false,
    // 禁用自动时区转换以提升性能
    timezone: '+08:00'
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功.');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
}; 