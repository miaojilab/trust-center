const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 审核历史记录（提交/重新提交/通过/拒绝）
 */
const ReviewLog = sequelize.define('ReviewLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  submissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '认证提交ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '提交人用户ID'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '审核人用户ID'
  },
  action: {
    type: DataTypes.ENUM('submit', 'resubmit', 'approve', 'reject'),
    allowNull: false,
    comment: '操作类型'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    comment: '操作后的认证状态'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注/拒绝原因'
  }
}, {
  tableName: 'kyc_review_logs',
  timestamps: true,
  indexes: [
    { fields: ['submissionId'] },
    { fields: ['submissionId', 'createdAt'] }
  ]
});

module.exports = ReviewLog;
