const { sequelize } = require('../config/database');
const User = require('./User');
const KYCScheme = require('./KYCScheme');
const KYCSubmission = require('./KYCSubmission');

const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('数据库同步成功');
  } catch (error) {
    console.error('数据库同步失败:', error);
  }
};

module.exports = {
  sequelize,
  User,
  KYCScheme,
  KYCSubmission,
  syncDatabase
}; 