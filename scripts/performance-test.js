/**
 * 性能测试脚本
 * 
 * 用于测试关键API接口的响应时间
 * 运行方式: node scripts/performance-test.js
 */

const { User, KYCScheme, KYCSubmission } = require('../models');
const { Op } = require('sequelize');

// 性能测试辅助函数
async function measureTime(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`✓ ${name}: ${duration}ms`);
    return { success: true, duration, result };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`✗ ${name}: ${duration}ms (错误: ${error.message})`);
    return { success: false, duration, error: error.message };
  }
}

async function runPerformanceTests() {
  console.log('🚀 开始性能测试...\n');
  console.log('='  .repeat(60));
  
  const results = [];
  
  // 测试 1: 仪表板统计查询（并行）
  console.log('\n📊 测试 1: 仪表板统计查询（并行优化后）');
  const dashboardResult = await measureTime('仪表板统计', async () => {
    const [userCount, schemeCount, submissionTotal, submissionPending, submissionApproved, submissionRejected] = await Promise.all([
      User.count(),
      KYCScheme.count({ where: { status: 'active' } }),
      KYCSubmission.count(),
      KYCSubmission.count({ where: { status: 'pending' } }),
      KYCSubmission.count({ where: { status: 'approved' } }),
      KYCSubmission.count({ where: { status: 'rejected' } })
    ]);
    return { userCount, schemeCount, submissionTotal, submissionPending, submissionApproved, submissionRejected };
  });
  results.push(dashboardResult);
  if (dashboardResult.success) {
    console.log(`   数据: 用户 ${dashboardResult.result.userCount}, 方案 ${dashboardResult.result.schemeCount}, 提交 ${dashboardResult.result.submissionTotal}`);
  }
  
  // 测试 2: 待审核列表查询（并行）
  console.log('\n📋 测试 2: 待审核列表查询（并行优化后）');
  const pendingResult = await measureTime('待审核列表', async () => {
    const whereCondition = { status: 'pending' };
    const [total, submissions] = await Promise.all([
      KYCSubmission.count({
        where: whereCondition,
        distinct: true
      }),
      KYCSubmission.findAll({
        where: whereCondition,
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email']
          },
          {
            model: KYCScheme,
            attributes: ['id', 'name']
          }
        ],
        attributes: ['id', 'status', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'ASC']],
        limit: 20
      })
    ]);
    return { total, count: submissions.length };
  });
  results.push(pendingResult);
  if (pendingResult.success) {
    console.log(`   数据: 总计 ${pendingResult.result.total} 条，本次获取 ${pendingResult.result.count} 条`);
  }
  
  // 测试 3: 用户名搜索（使用索引）
  console.log('\n🔍 测试 3: 用户搜索查询（索引优化后）');
  const searchResult = await measureTime('用户搜索', async () => {
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: '%test%' } },
          { email: { [Op.like]: '%test%' } }
        ]
      },
      attributes: ['id', 'username', 'email'],
      limit: 10
    });
    return users.length;
  });
  results.push(searchResult);
  if (searchResult.success) {
    console.log(`   数据: 找到 ${searchResult.result} 个匹配用户`);
  }
  
  // 测试 4: 按状态筛选提交（使用索引）
  console.log('\n📝 测试 4: 按状态筛选提交（索引优化后）');
  const statusResult = await measureTime('状态筛选', async () => {
    const submissions = await KYCSubmission.findAll({
      where: { status: 'approved' },
      attributes: ['id', 'userId', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    return submissions.length;
  });
  results.push(statusResult);
  if (statusResult.success) {
    console.log(`   数据: 找到 ${statusResult.result} 条已批准记录`);
  }
  
  // 测试 5: 用户提交记录查询
  console.log('\n👤 测试 5: 用户提交记录查询');
  const userSubmissionsResult = await measureTime('用户提交记录', async () => {
    // 获取第一个用户ID进行测试
    const firstUser = await User.findOne({ attributes: ['id'] });
    if (!firstUser) return 0;
    
    const submissions = await KYCSubmission.findAll({
      where: { userId: firstUser.id },
      include: [{
        model: KYCScheme,
        attributes: ['id', 'name', 'description']
      }],
      attributes: ['id', 'schemeId', 'status', 'rejectReason', 'createdAt', 'updatedAt', 'reviewedAt'],
      order: [['createdAt', 'DESC']]
    });
    return submissions.length;
  });
  results.push(userSubmissionsResult);
  if (userSubmissionsResult.success) {
    console.log(`   数据: 找到 ${userSubmissionsResult.result} 条提交记录`);
  }
  
  // 测试 6: 复杂联合查询（带搜索的待审核列表）
  console.log('\n🔗 测试 6: 复杂联合查询（带用户搜索）');
  const complexResult = await measureTime('复杂联合查询', async () => {
    const whereCondition = { status: 'pending' };
    const userWhere = {
      [Op.or]: [
        { username: { [Op.like]: '%a%' } },
        { email: { [Op.like]: '%a%' } }
      ]
    };
    
    const [total, submissions] = await Promise.all([
      KYCSubmission.count({
        where: whereCondition,
        include: [{
          model: User,
          attributes: [],
          where: userWhere
        }],
        distinct: true
      }),
      KYCSubmission.findAll({
        where: whereCondition,
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email'],
            where: userWhere
          },
          {
            model: KYCScheme,
            attributes: ['id', 'name']
          }
        ],
        attributes: ['id', 'status', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'ASC']],
        limit: 20
      })
    ]);
    return { total, count: submissions.length };
  });
  results.push(complexResult);
  if (complexResult.success) {
    console.log(`   数据: 总计 ${complexResult.result.total} 条，本次获取 ${complexResult.result.count} 条`);
  }
  
  // 输出汇总
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 性能测试汇总：\n');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ 成功: ${successfulTests.length}/${results.length}`);
  console.log(`❌ 失败: ${failedTests.length}/${results.length}`);
  
  if (successfulTests.length > 0) {
    const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
    const maxDuration = Math.max(...successfulTests.map(r => r.duration));
    const minDuration = Math.min(...successfulTests.map(r => r.duration));
    
    console.log(`\n⏱️  平均响应时间: ${avgDuration.toFixed(2)}ms`);
    console.log(`⚡ 最快响应: ${minDuration}ms`);
    console.log(`🐌 最慢响应: ${maxDuration}ms`);
  }
  
  // 性能评估
  console.log('\n🎯 性能评估：');
  if (successfulTests.length > 0) {
    const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
    if (avgDuration < 100) {
      console.log('   ⭐⭐⭐ 优秀！平均响应时间小于100ms');
    } else if (avgDuration < 200) {
      console.log('   ⭐⭐ 良好！平均响应时间在100-200ms之间');
    } else if (avgDuration < 500) {
      console.log('   ⭐ 一般，平均响应时间在200-500ms之间，建议进一步优化');
    } else {
      console.log('   ⚠️ 需要优化！平均响应时间超过500ms');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 性能测试完成\n');
}

// 执行测试
runPerformanceTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 测试执行失败:', error);
    process.exit(1);
  });
