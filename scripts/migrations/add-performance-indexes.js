/**
 * 性能优化：为已有数据库添加索引
 * 
 * 此脚本为KYC中心数据库添加性能优化索引
 * 运行方式: node scripts/migrations/add-performance-indexes.js
 */

const { sequelize } = require('../../config/database');

async function addIndexes() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('开始添加性能优化索引...\n');
    
    // 检查并添加 kyc_submissions 表的索引
    console.log('1. 为 kyc_submissions 表添加索引...');
    
    // status 索引
    try {
      await queryInterface.addIndex('kyc_submissions', ['status'], {
        name: 'idx_submissions_status',
        concurrently: true  // 在线添加索引，不锁表（MySQL 5.6+）
      });
      console.log('   ✓ status 索引添加成功');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('   - status 索引已存在，跳过');
      } else {
        console.error('   ✗ status 索引添加失败:', error.message);
      }
    }
    
    // status + createdAt 复合索引
    try {
      await queryInterface.addIndex('kyc_submissions', ['status', 'createdAt'], {
        name: 'idx_submissions_status_created',
        concurrently: true
      });
      console.log('   ✓ status + createdAt 复合索引添加成功');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('   - status + createdAt 复合索引已存在，跳过');
      } else {
        console.error('   ✗ status + createdAt 复合索引添加失败:', error.message);
      }
    }
    
    // schemeId 索引
    try {
      await queryInterface.addIndex('kyc_submissions', ['schemeId'], {
        name: 'idx_submissions_scheme_id',
        concurrently: true
      });
      console.log('   ✓ schemeId 索引添加成功');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('   - schemeId 索引已存在，跳过');
      } else {
        console.error('   ✗ schemeId 索引添加失败:', error.message);
      }
    }
    
    // 检查并添加 users 表的索引
    console.log('\n2. 为 users 表添加索引...');
    
    // username 索引
    try {
      await queryInterface.addIndex('users', ['username'], {
        name: 'idx_users_username',
        concurrently: true
      });
      console.log('   ✓ username 索引添加成功');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('   - username 索引已存在，跳过');
      } else {
        console.error('   ✗ username 索引添加失败:', error.message);
      }
    }
    
    // email 索引
    try {
      await queryInterface.addIndex('users', ['email'], {
        name: 'idx_users_email',
        concurrently: true
      });
      console.log('   ✓ email 索引添加成功');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('   - email 索引已存在，跳过');
      } else {
        console.error('   ✗ email 索引添加失败:', error.message);
      }
    }
    
    // isAdmin 索引
    try {
      await queryInterface.addIndex('users', ['isAdmin'], {
        name: 'idx_users_is_admin',
        concurrently: true
      });
      console.log('   ✓ isAdmin 索引添加成功');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('   - isAdmin 索引已存在，跳过');
      } else {
        console.error('   ✗ isAdmin 索引添加失败:', error.message);
      }
    }
    
    console.log('\n✅ 索引添加完成！');
    console.log('\n建议：运行以下SQL查询检查索引状态：');
    console.log('SHOW INDEX FROM kyc_submissions;');
    console.log('SHOW INDEX FROM users;');
    
  } catch (error) {
    console.error('\n❌ 迁移过程中发生错误:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 运行迁移
addIndexes()
  .then(() => {
    console.log('\n数据库连接已关闭');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n迁移失败:', error);
    process.exit(1);
  });
