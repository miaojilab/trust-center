const { User, KYCScheme, KYCSubmission } = require('../models');
const { Op } = require('sequelize');

// 简单的内存缓存，用于缓存方案列表
let schemesCache = null;
let schemesCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 用户KYC状态缓存 - 使用 Map 存储每个用户的状态
const userStatusCache = new Map();
const STATUS_CACHE_DURATION = 2 * 60 * 1000; // 2分钟缓存（比方案列表短，因为状态更新更频繁）

// KYCScheme 缓存 - 方案数据很少且几乎不变，全部缓存
const allSchemesCache = new Map();
let allSchemesCacheTime = 0;
const ALL_SCHEMES_CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存

// 清除单个用户的KYC状态缓存
const clearUserStatusCache = (userId) => {
  userStatusCache.delete(userId);
};

// 清除全部方案缓存
const clearAllSchemesCache = () => {
  allSchemesCache.clear();
  allSchemesCacheTime = 0;
};

// 获取所有方案（内部使用，带缓存）
const getAllSchemesInternal = async () => {
  const now = Date.now();
  
  // 检查缓存是否有效
  if (allSchemesCache.size > 0 && (now - allSchemesCacheTime) < ALL_SCHEMES_CACHE_DURATION) {
    console.log(`[缓存] getAllSchemesInternal - 命中，缓存大小: ${allSchemesCache.size}`);
    return allSchemesCache;
  }
  
  console.log(`[缓存] getAllSchemesInternal - 未命中，重新查询数据库`);
  
  // 缓存过期或为空，重新加载
  // 查询所有字段以便计算 fieldsCount
  const schemes = await KYCScheme.findAll({
    attributes: ['id', 'name', 'description', 'status', 'fields', 'createdAt', 'updatedAt'],
    raw: true
  });
  
  console.log(`[缓存] getAllSchemesInternal - 查询到 ${schemes.length} 个方案`);
  
  // 清空并重建缓存
  allSchemesCache.clear();
  schemes.forEach(scheme => {
    allSchemesCache.set(scheme.id, scheme);
  });
  allSchemesCacheTime = now;
  
  return allSchemesCache;
};

// 获取所有KYC方案（优化版：复用 getAllSchemesInternal 缓存，避免重复查询）
const getAllSchemes = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const now = Date.now();
    
    // 检查公共接口的缓存
    if (schemesCache && (now - schemesCacheTime) < CACHE_DURATION) {
      console.log(`[性能] getAllSchemes - 公共缓存命中，耗时: ${Date.now() - startTime}ms`);
      return res.status(200).json({
        success: true,
        data: schemesCache,
        cached: true
      });
    }
    
    // 关键优化：复用 getAllSchemesInternal 的缓存，避免重复查询
    // 当前端同时请求 getAllSchemes 和 getKYCStatus 时，不会重复查询数据库
    const dbQueryStart = Date.now();
    const schemesMap = await getAllSchemesInternal();
    console.log(`[性能] getAllSchemes - 获取方案数据耗时: ${Date.now() - dbQueryStart}ms`);
    
    // 转换为数组并添加 fieldsCount
    const schemesWithCount = Array.from(schemesMap.values())
      .filter(scheme => scheme.status === 'active')  // 只返回活跃方案
      .map(scheme => {
        // 计算 fieldsCount（如果缓存中没有）
        let fieldsCount = 0;
        if (scheme.fields) {
          fieldsCount = Array.isArray(scheme.fields) ? scheme.fields.length : 0;
        }
        
        return {
          id: scheme.id,
          name: scheme.name,
          description: scheme.description,
          fieldsCount: fieldsCount,
          createdAt: scheme.createdAt,
          updatedAt: scheme.updatedAt
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // 缓存结果（公共接口缓存）
    schemesCache = schemesWithCount;
    schemesCacheTime = now;
    
    const totalTime = Date.now() - startTime;
    console.log(`[性能] getAllSchemes - 总耗时: ${totalTime}ms`);
    
    // 如果查询超过 50ms，记录警告
    if (totalTime > 50) {
      console.warn(`[警告] getAllSchemes - 查询较慢: ${totalTime}ms`);
    }
    
    return res.status(200).json({
      success: true,
      data: schemesWithCount
    });
  } catch (error) {
    console.error('[错误] getAllSchemes - 查询失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取KYC方案列表失败',
      error: error.message
    });
  }
};

// 获取单个KYC方案详情
const getSchemeById = async (req, res) => {
  try {
    const scheme = await KYCScheme.findByPk(req.params.id);
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的KYC方案'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: scheme
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '获取KYC方案详情失败',
      error: error.message
    });
  }
};

// 提交KYC认证资料
const submitKYC = async (req, res) => {
  const { schemeId, data } = req.body;
  const userId = req.userId;
  
  if (!schemeId || !data) {
    return res.status(400).json({
      success: false,
      message: '提交信息不完整'
    });
  }
  
  try {
    // 检查方案是否存在
    const scheme = await KYCScheme.findByPk(schemeId);
    
    if (!scheme || scheme.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '认证方案不存在或已禁用'
      });
    }
    
    // 验证提交的数据字段是否符合方案定义
    const schemeFields = scheme.fields || [];
    const requiredFields = schemeFields.filter(field => field.required).map(field => field.name);
    
    // 检查必填字段是否都已提交
    const missingFields = requiredFields.filter(fieldName => !data[fieldName]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }
    
    // 检查是否已提交过
    const existingSubmission = await KYCSubmission.findOne({
      where: { userId, schemeId }
    });
    
    // 如果已提交且状态为已批准，则不允许再次提交
    if (existingSubmission && existingSubmission.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: '您已通过此认证方案，无需重复提交'
      });
    }
    
    // 如果存在提交记录，则更新
    if (existingSubmission) {
      existingSubmission.data = data;
      existingSubmission.status = 'pending';
      existingSubmission.rejectReason = null;
      existingSubmission.reviewerId = null;
      existingSubmission.reviewedAt = null;
      await existingSubmission.save();
      
      // 清除该用户的KYC状态缓存
      clearUserStatusCache(userId);
      
      return res.status(200).json({
        success: true,
        message: '认证资料已更新，等待审核',
        data: {
          id: existingSubmission.id,
          status: existingSubmission.status,
          updatedAt: existingSubmission.updatedAt
        }
      });
    }
    
    // 创建新的提交记录
    const submission = await KYCSubmission.create({
      userId,
      schemeId,
      data,
      status: 'pending'
    });
    
    // 清除该用户的KYC状态缓存
    clearUserStatusCache(userId);
    
    return res.status(201).json({
      success: true,
      message: '认证资料提交成功，等待审核',
      data: {
        id: submission.id,
        status: submission.status,
        createdAt: submission.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '提交认证资料失败',
      error: error.message
    });
  }
};

// 获取用户KYC认证状态（优化版：去除 JOIN，使用内存缓存拼接）
const getKYCStatus = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.userId;
    const now = Date.now();
    
    // 检查用户状态缓存
    const cached = userStatusCache.get(userId);
    if (cached && (now - cached.timestamp) < STATUS_CACHE_DURATION) {
      console.log(`[性能] getKYCStatus - 用户 ${userId} 缓存命中，耗时: ${Date.now() - startTime}ms`);
      return res.status(200).json({
        success: true,
        data: cached.data,
        cached: true
      });
    }
    
    // 并行查询：获取用户提交记录 + 所有方案缓存
    const dbQueryStart = Date.now();
    const [submissions, schemesMap] = await Promise.all([
      // 查询用户提交记录（无 JOIN，速度极快）
      KYCSubmission.findAll({
        where: { userId },
        attributes: ['id', 'schemeId', 'status', 'rejectReason', 'createdAt', 'updatedAt', 'reviewedAt'],
        order: [['createdAt', 'DESC']]
      }),
      // 获取所有方案（从内存缓存）
      getAllSchemesInternal()
    ]);
    console.log(`[性能] getKYCStatus - 数据库查询耗时: ${Date.now() - dbQueryStart}ms`);
    
    // 在内存中拼接数据（极快）
    const submissionsData = submissions.map(submission => {
      const submissionData = submission.toJSON();
      const scheme = schemesMap.get(submission.schemeId);
      
      // 添加方案信息
      if (scheme) {
        submissionData.KYCScheme = {
          id: scheme.id,
          name: scheme.name
        };
      }
      
      return submissionData;
    });
    
    // 缓存结果
    userStatusCache.set(userId, {
      data: submissionsData,
      timestamp: now
    });
    
    // 定期清理过期缓存（避免内存泄漏）
    if (userStatusCache.size > 1000) {
      for (const [key, value] of userStatusCache.entries()) {
        if (now - value.timestamp > STATUS_CACHE_DURATION) {
          userStatusCache.delete(key);
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[性能] getKYCStatus - 用户 ${userId} 总耗时: ${totalTime}ms`);
    
    // 如果查询超过 100ms，记录警告
    if (totalTime > 100) {
      console.warn(`[警告] getKYCStatus - 用户 ${userId} 查询较慢: ${totalTime}ms`);
    }
    
    return res.status(200).json({
      success: true,
      data: submissionsData
    });
  } catch (error) {
    console.error(`[错误] getKYCStatus - 用户 ${req.userId} 失败:`, error);
    return res.status(500).json({
      success: false,
      message: '获取认证状态失败',
      error: error.message
    });
  }
};

// 管理员：获取待审核的KYC列表
const getPendingSubmissions = async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '', status = 'pending' } = req.query;
    
    // 限制每页最大数量，防止过大的查询
    const maxLimit = 100;
    const actualLimit = Math.min(parseInt(limit), maxLimit);
    const actualOffset = parseInt(page) * actualLimit;
    
    // 构建查询条件
    const whereCondition = {};
    
    // 如果提供了状态筛选
    if (status) {
      whereCondition.status = status;
    }
    
    // 如果提供了搜索条件
    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 构建include配置
    const includeConfig = [
      {
        model: User,
        attributes: ['id', 'username', 'email'],
        ...(search ? { where: userWhere } : {})
      },
      {
        model: KYCScheme,
        attributes: ['id', 'name']
      }
    ];
    
    // 并行执行count和findAll查询
    const [total, submissions] = await Promise.all([
      KYCSubmission.count({
        where: whereCondition,
        include: search ? [{
          model: User,
          attributes: [],
          where: userWhere
        }] : [],
        distinct: true  // 添加distinct避免JOIN导致的重复计数
      }),
      KYCSubmission.findAll({
        where: whereCondition,
        include: includeConfig,
        attributes: ['id', 'status', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'ASC']],
        offset: actualOffset,
        limit: actualLimit
      })
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        items: submissions,
        total,
        page: parseInt(page),
        limit: actualLimit
      }
    });
  } catch (error) {
    console.error('获取待审核列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取待审核列表失败',
      error: error.message
    });
  }
};

// 管理员：审核KYC提交
const reviewSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { status, rejectReason } = req.body;
  const reviewerId = req.userId;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: '无效的审核状态'
    });
  }
  
  if (status === 'rejected' && !rejectReason) {
    return res.status(400).json({
      success: false,
      message: '拒绝时必须提供原因'
    });
  }
  
  try {
    const submission = await KYCSubmission.findByPk(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的认证记录'
      });
    }
    
    // 移除状态检查，允许更新任何状态的认证
    // 记录原始状态用于响应消息
    const originalStatus = submission.status;
    
    submission.status = status;
    submission.rejectReason = status === 'rejected' ? rejectReason : null;
    submission.reviewerId = reviewerId;
    submission.reviewedAt = new Date();
    
    await submission.save();
    
    // 清除该用户的KYC状态缓存
    clearUserStatusCache(submission.userId);
    
    // 添加审核历史记录（如果有相关模型）
    // 如果需要，可以在此处添加历史记录代码
    
    return res.status(200).json({
      success: true,
      message: originalStatus === 'pending' 
        ? `认证记录已${status === 'approved' ? '批准' : '拒绝'}`
        : `认证记录状态已更新为${status === 'approved' ? '已批准' : '已拒绝'}`,
      data: {
        id: submission.id,
        status: submission.status,
        previousStatus: originalStatus,
        reviewedAt: submission.reviewedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '处理审核失败',
      error: error.message
    });
  }
};

// 管理员：创建新的KYC方案
const createScheme = async (req, res) => {
  const { name, description, fields } = req.body;
  
  if (!name || !fields) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的方案信息'
    });
  }
  
  try {
    // 确保每个字段的id和name都存在且一致
    const validatedFields = fields.map(field => {
      // 如果字段没有id，生成一个
      if (!field.id) {
        field.id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // 如果字段没有name，使用id
      if (!field.name) {
        field.name = field.id;
      }
      
      return field;
    });
    
    const scheme = await KYCScheme.create({
      name,
      description,
      fields: validatedFields,
      status: 'active'
    });
    
    // 清除缓存
    schemesCache = null;
    schemesCacheTime = 0;
    clearAllSchemesCache(); // 同时清除方案内部缓存
    
    return res.status(201).json({
      success: true,
      message: '认证方案创建成功',
      data: scheme
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '创建认证方案失败',
      error: error.message
    });
  }
};

// 管理员：更新KYC方案
const updateScheme = async (req, res) => {
  const { id } = req.params;
  const { name, description, fields, isActive } = req.body;
  
  if (!name || !fields) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的方案信息'
    });
  }
  
  try {
    const scheme = await KYCScheme.findByPk(id);
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的KYC方案'
      });
    }
    
    // 确保每个字段的id和name都存在且一致
    const validatedFields = fields.map(field => {
      // 如果字段没有id，生成一个
      if (!field.id) {
        field.id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // 如果字段没有name，使用id
      if (!field.name) {
        field.name = field.id;
      }
      
      return field;
    });
    
    // 更新方案信息
    scheme.name = name;
    scheme.description = description;
    scheme.fields = validatedFields;
    
    // 如果isActive存在，更新状态
    if (isActive !== undefined) {
      scheme.status = isActive ? 'active' : 'inactive';
    }
    
    await scheme.save();
    
    // 清除缓存
    schemesCache = null;
    schemesCacheTime = 0;
    clearAllSchemesCache(); // 同时清除方案内部缓存
    
    return res.status(200).json({
      success: true,
      message: '认证方案已成功更新',
      data: scheme
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '更新认证方案失败',
      error: error.message
    });
  }
};

// API: 查询用户KYC认证状态（仅返回是否通过）
const checkVerificationStatus = async (req, res) => {
  const { oauthId, schemeId } = req.query;
  
  if (!oauthId || !schemeId) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的查询参数'
    });
  }
  
  try {
    // 查找用户
    const user = await User.findOne({ where: { oauthId } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 查找认证记录
    const submission = await KYCSubmission.findOne({
      where: {
        userId: user.id,
        schemeId
      }
    });
    
    // 返回认证状态
    return res.status(200).json({
      success: true,
      data: {
        verified: submission?.status === 'approved',
        status: submission?.status || 'not_submitted'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '查询认证状态失败',
      error: error.message
    });
  }
};

// API: 查询用户KYC详细信息（需要API密钥）
const getVerificationDetails = async (req, res) => {
  const { oauthId, schemeId } = req.query;
  
  console.log('API查询参数:', { oauthId, schemeId, hasApiKey: Boolean(req.headers['x-api-key'] || req.query.apiKey) });
  
  if (!oauthId || !schemeId) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的查询参数'
    });
  }
  
  try {
    // 查找用户
    const user = await User.findOne({ where: { oauthId } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 查找认证记录和方案
    const submission = await KYCSubmission.findOne({
      where: {
        userId: user.id,
        schemeId
      },
      include: [{
        model: KYCScheme,
        attributes: ['name', 'fields']
      }]
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '未找到认证记录'
      });
    }
    
    if (submission.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: '用户未通过此认证方案'
      });
    }
    
    // 返回认证详情
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        scheme: {
          id: submission.schemeId,
          name: submission.KYCScheme.name
        },
        verificationData: submission.data,
        verifiedAt: submission.reviewedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '查询认证详情失败',
      error: error.message
    });
  }
};

// 组合接口：一次性获取方案列表和用户状态（解决并发竞争问题）
const getInitialData = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.userId;
    const now = Date.now();
    
    // 并行获取两个数据（在后端并行，避免前端两次请求）
    const [schemesMap, userStatusCached] = await Promise.all([
      getAllSchemesInternal(),
      Promise.resolve(userStatusCache.get(userId))
    ]);
    
    // 1. 准备方案列表数据
    const schemes = Array.from(schemesMap.values())
      .filter(scheme => scheme.status === 'active')
      .map(scheme => ({
        id: scheme.id,
        name: scheme.name,
        description: scheme.description,
        fieldsCount: scheme.fields?.length || 0,
        createdAt: scheme.createdAt,
        updatedAt: scheme.updatedAt
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // 2. 准备用户状态数据
    let userStatus = [];
    let statusFromCache = false;
    
    // 检查用户状态缓存
    if (userStatusCached && (now - userStatusCached.timestamp) < STATUS_CACHE_DURATION) {
      userStatus = userStatusCached.data;
      statusFromCache = true;
      console.log(`[性能] getInitialData - 用户 ${userId} 状态缓存命中`);
    } else {
      // 查询用户提交记录
      const submissions = await KYCSubmission.findAll({
        where: { userId },
        attributes: ['id', 'schemeId', 'status', 'rejectReason', 'createdAt', 'updatedAt', 'reviewedAt'],
        order: [['createdAt', 'DESC']]
      });
      
      // 在内存中拼接方案信息
      userStatus = submissions.map(submission => {
        const submissionData = submission.toJSON();
        const scheme = schemesMap.get(submission.schemeId);
        
        if (scheme) {
          submissionData.KYCScheme = {
            id: scheme.id,
            name: scheme.name
          };
        }
        
        return submissionData;
      });
      
      // 缓存用户状态
      userStatusCache.set(userId, {
        data: userStatus,
        timestamp: now
      });
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[性能] getInitialData - 用户 ${userId} 总耗时: ${totalTime}ms (状态缓存: ${statusFromCache})`);
    
    // 如果查询超过 50ms，记录警告
    if (totalTime > 50) {
      console.warn(`[警告] getInitialData - 用户 ${userId} 查询较慢: ${totalTime}ms`);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        schemes,
        userStatus
      }
    });
  } catch (error) {
    console.error(`[错误] getInitialData - 用户 ${req.userId} 失败:`, error);
    return res.status(500).json({
      success: false,
      message: '获取初始数据失败',
      error: error.message
    });
  }
};

// 获取用户所有提交记录
const getUserSubmissions = async (req, res) => {
  try {
    const submissions = await KYCSubmission.findAll({
      where: { userId: req.userId },
      include: [{
        model: KYCScheme,
        attributes: ['id', 'name', 'description']
      }],
      attributes: ['id', 'schemeId', 'status', 'rejectReason', 'createdAt', 'updatedAt', 'reviewedAt'],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '获取提交记录失败',
      error: error.message
    });
  }
};

// 获取管理员仪表盘统计数据
const getDashboardStats = async (req, res) => {
  try {
    // 并行执行所有查询以提高性能
    const [userCount, schemeCount, submissionTotal, submissionPending, submissionApproved, submissionRejected] = await Promise.all([
      User.count(),
      KYCScheme.count({ where: { status: 'active' } }),
      KYCSubmission.count(),
      KYCSubmission.count({ where: { status: 'pending' } }),
      KYCSubmission.count({ where: { status: 'approved' } }),
      KYCSubmission.count({ where: { status: 'rejected' } })
    ]);
    
    const submissionStats = {
      total: submissionTotal,
      pending: submissionPending,
      approved: submissionApproved,
      rejected: submissionRejected
    };
    
    return res.status(200).json({
      success: true,
      data: {
        userCount,
        schemeCount,
        submissionStats
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

// 管理员：获取所有KYC方案 (包括非活跃的)
const getAdminSchemes = async (req, res) => {
  try {
    const schemes = await KYCScheme.findAll({
      attributes: ['id', 'name', 'description', 'fields', 'status', 'createdAt', 'updatedAt']
    });
    
    return res.status(200).json({
      success: true,
      data: schemes
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '获取KYC方案列表失败',
      error: error.message
    });
  }
};

// 管理员：删除KYC方案
const deleteScheme = async (req, res) => {
  const { id } = req.params;
  
  try {
    // 检查是否有关联的提交记录
    const submissions = await KYCSubmission.count({
      where: { schemeId: id }
    });
    
    if (submissions > 0) {
      return res.status(400).json({
        success: false,
        message: '该方案已有关联的认证数据，无法删除。您可以将其设置为非活跃状态。'
      });
    }
    
    const scheme = await KYCScheme.findByPk(id);
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的KYC方案'
      });
    }
    
    // 实际删除方案
    await scheme.destroy();
    
    // 清除缓存
    schemesCache = null;
    schemesCacheTime = 0;
    clearAllSchemesCache(); // 同时清除方案内部缓存
    
    return res.status(200).json({
      success: true,
      message: '认证方案已成功删除'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '删除认证方案失败',
      error: error.message
    });
  }
};

// 获取用户提交记录详情
const getSubmissionDetails = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的提交记录ID'
    });
  }

  try {
    // 查找提交记录
    const submission = await KYCSubmission.findOne({
      where: { 
        id, 
        userId // 确保只能查看自己的提交记录
      },
      include: [{
        model: KYCScheme,
        attributes: ['id', 'name', 'fields']
      }],
      attributes: ['id', 'schemeId', 'data', 'status', 'rejectReason', 'reviewerId', 'reviewedAt', 'createdAt', 'updatedAt']
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的提交记录'
      });
    }

    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('获取提交记录详情失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取提交记录详情失败',
      error: error.message
    });
  }
};

// 管理员：获取单个提交记录详情
const getAdminSubmissionDetails = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的提交记录ID'
    });
  }

  try {
    // 查找提交记录（管理员可以查看任何用户的记录）
    const submission = await KYCSubmission.findOne({
      where: { id },
      include: [
        {
          model: KYCScheme,
          attributes: ['id', 'name', 'fields']
        },
        {
          model: User,
          attributes: ['id', 'username', 'email', 'createdAt']
        }
      ],
      attributes: ['id', 'userId', 'schemeId', 'data', 'status', 'rejectReason', 'reviewerId', 'reviewedAt', 'createdAt', 'updatedAt']
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的提交记录'
      });
    }

    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('获取提交记录详情失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取提交记录详情失败',
      error: error.message
    });
  }
};

// 管理员：批准KYC提交
const approveSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const reviewerId = req.userId;
  
  try {
    const submission = await KYCSubmission.findByPk(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的认证记录'
      });
    }
    
    // 移除状态检查，允许更新任何状态的认证
    // 记录原始状态用于响应消息
    const originalStatus = submission.status;
    
    submission.status = 'approved';
    submission.rejectReason = null;
    submission.reviewerId = reviewerId;
    submission.reviewedAt = new Date();
    
    await submission.save();
    
    // 清除该用户的KYC状态缓存
    clearUserStatusCache(submission.userId);
    
    // 添加审核历史记录（如果有相关模型）
    // 如果需要，可以在此处添加历史记录代码
    
    return res.status(200).json({
      success: true,
      message: originalStatus === 'pending' ? '认证记录已批准' : '认证记录状态已更新为已批准',
      data: {
        id: submission.id,
        status: submission.status,
        previousStatus: originalStatus,
        reviewedAt: submission.reviewedAt
      }
    });
  } catch (error) {
    console.error('批准认证记录失败:', error);
    return res.status(500).json({
      success: false,
      message: '批准认证记录失败',
      error: error.message
    });
  }
};

// 管理员：拒绝KYC提交
const rejectSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { reason } = req.body;
  const reviewerId = req.userId;
  
  if (!reason) {
    return res.status(400).json({
      success: false,
      message: '拒绝时必须提供原因'
    });
  }
  
  try {
    const submission = await KYCSubmission.findByPk(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的认证记录'
      });
    }
    
    // 移除状态检查，允许更新任何状态的认证
    // 记录原始状态用于响应消息
    const originalStatus = submission.status;
    
    submission.status = 'rejected';
    submission.rejectReason = reason;
    submission.reviewerId = reviewerId;
    submission.reviewedAt = new Date();
    
    await submission.save();
    
    // 清除该用户的KYC状态缓存
    clearUserStatusCache(submission.userId);
    
    // 添加审核历史记录（如果有相关模型）
    // 如果需要，可以在此处添加历史记录代码
    
    return res.status(200).json({
      success: true,
      message: originalStatus === 'pending' ? '认证记录已拒绝' : '认证记录状态已更新为已拒绝',
      data: {
        id: submission.id,
        status: submission.status,
        previousStatus: originalStatus,
        reviewedAt: submission.reviewedAt
      }
    });
  } catch (error) {
    console.error('拒绝认证记录失败:', error);
    return res.status(500).json({
      success: false,
      message: '拒绝认证记录失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllSchemes,
  getSchemeById,
  submitKYC,
  getKYCStatus,
  getInitialData,        // 新增：组合接口
  getPendingSubmissions,
  reviewSubmission,
  createScheme,
  updateScheme,
  checkVerificationStatus,
  getVerificationDetails,
  getUserSubmissions,
  getDashboardStats,
  getAdminSchemes,
  deleteScheme,
  getSubmissionDetails,
  getAdminSubmissionDetails,
  approveSubmission,
  rejectSubmission
}; 