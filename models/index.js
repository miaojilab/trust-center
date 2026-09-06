const { sequelize } = require('../config/database');
const User = require('./User');
const KYCScheme = require('./KYCScheme');
const KYCSubmission = require('./KYCSubmission');
const ReviewLog = require('./ReviewLog');

// 审核历史关联
KYCSubmission.hasMany(ReviewLog, { foreignKey: 'submissionId', as: 'reviewLogs' });
ReviewLog.belongsTo(KYCSubmission, { foreignKey: 'submissionId' });
ReviewLog.belongsTo(User, { foreignKey: 'reviewerId', as: 'Reviewer' });
ReviewLog.belongsTo(User, { foreignKey: 'userId', as: 'Submitter' });

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
  ReviewLog,
  syncDatabase
};
