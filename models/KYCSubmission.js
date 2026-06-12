const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const KYCScheme = require('./KYCScheme');

const KYCSubmission = sequelize.define('KYCSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    comment: '用户ID'
  },
  schemeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: KYCScheme,
      key: 'id'
    },
    comment: '认证方案ID'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '认证数据，JSON格式'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: '认证状态'
  },
  rejectReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '拒绝原因'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    comment: '审核员ID'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  }
}, {
  tableName: 'kyc_submissions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'schemeId']
    },
    // 为用户维度查询建立索引（加速 where userId=?）
    { fields: ['userId'] },
    // 为按时间获取最新记录建立复合索引（根据实际排序字段二选一）
    { fields: ['userId', 'updatedAt'] },
    // 为状态筛选建立索引（加速 where status=? 查询）
    { fields: ['status'] },
    // 为管理员查询建立复合索引（加速按状态和时间排序的查询）
    { fields: ['status', 'createdAt'] },
    // 为方案查询建立索引
    { fields: ['schemeId'] }
  ]
});

// 定义关联关系
User.hasMany(KYCSubmission, { foreignKey: 'userId' });
KYCSubmission.belongsTo(User, { foreignKey: 'userId' });

KYCScheme.hasMany(KYCSubmission, { foreignKey: 'schemeId' });
KYCSubmission.belongsTo(KYCScheme, { foreignKey: 'schemeId' });

// 审核员关联
User.hasMany(KYCSubmission, { foreignKey: 'reviewerId', as: 'ReviewedSubmissions' });
KYCSubmission.belongsTo(User, { foreignKey: 'reviewerId', as: 'Reviewer' });

module.exports = KYCSubmission; 