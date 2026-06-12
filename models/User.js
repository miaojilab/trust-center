const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  oauthId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'OAuth平台返回的唯一标识'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '用户名'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '电子邮箱'
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '头像URL'
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否管理员'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    comment: '用户状态'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    // oauthId已有unique约束会自动创建索引
    // 为搜索功能建立索引
    { fields: ['username'] },
    { fields: ['email'] },
    // 为管理员查询建立索引
    { fields: ['isAdmin'] }
  ]
});

module.exports = User; 