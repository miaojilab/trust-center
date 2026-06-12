// 显式迁移：为 KYCScheme 与 KYCSubmission 添加索引（支持回滚）
// 说明：无需 sequelize-cli，直接通过脚本执行

const path = require('path');
const { sequelize } = require('../../config/database');

/**
 * 添加索引（up）
 */
async function up() {
  const qi = sequelize.getQueryInterface();

  // KYCScheme: status 索引
  // 名称：idx_kyc_schemes_status
  await qi.addIndex('kyc_schemes', ['status'], {
    name: 'idx_kyc_schemes_status'
  });

  // KYCSubmission: userId 索引
  // 名称：idx_kyc_submissions_userId
  await qi.addIndex('kyc_submissions', ['userId'], {
    name: 'idx_kyc_submissions_userId'
  });

  // KYCSubmission: (userId, updatedAt) 复合索引
  // 名称：idx_kyc_submissions_userId_updatedAt
  await qi.addIndex('kyc_submissions', ['userId', 'updatedAt'], {
    name: 'idx_kyc_submissions_userId_updatedAt'
  });
}

/**
 * 回滚索引（down）
 */
async function down() {
  const qi = sequelize.getQueryInterface();

  // 回滚顺序与创建相反
  await qi.removeIndex('kyc_submissions', 'idx_kyc_submissions_userId_updatedAt');
  await qi.removeIndex('kyc_submissions', 'idx_kyc_submissions_userId');
  await qi.removeIndex('kyc_schemes', 'idx_kyc_schemes_status');
}

// 允许直接以 node 执行：node scripts/migrations/add-indexes.js up|down
if (require.main === module) {
  const cmd = process.argv[2] || 'up';
  (async () => {
    try {
      if (cmd === 'up') {
        await up();
        console.log('[migration] add-indexes up done');
      } else if (cmd === 'down') {
        await down();
        console.log('[migration] add-indexes down done');
      } else {
        throw new Error('unknown command, use: up|down');
      }
    } catch (err) {
      console.error('[migration] failed:', err);
      process.exitCode = 1;
    } finally {
      await sequelize.close();
    }
  })();
}

module.exports = { up, down };


