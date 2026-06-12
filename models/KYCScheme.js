const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KYCScheme = sequelize.define('KYCScheme', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '认证方案名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '认证方案描述'
  },
  fields: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '所需填写的字段，JSON格式'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '方案状态'
  }
}, {
  tableName: 'kyc_schemes',
  timestamps: true,
  // 为状态筛选建立索引（用于加速 where status='active' 等查询）
  indexes: [
    { fields: ['status'] }
  ]
});

module.exports = KYCScheme; 