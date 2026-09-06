const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const kycController = require('../controllers/kyc.controller');
const { verifyToken, verifyAdmin, verifyApiKey } = require('../middlewares/auth');

// 公共路由
router.post('/auth/callback', authController.handleOAuthCallback);

// 认证用户路由
router.get('/user', verifyToken, authController.getCurrentUser);
router.get('/user/submissions', verifyToken, kycController.getUserSubmissions);
router.get('/user/submissions/:id', verifyToken, kycController.getSubmissionDetails);
router.get('/kyc/initial-data', verifyToken, kycController.getInitialData);  // 新增：组合接口
router.get('/kyc/schemes', verifyToken, kycController.getAllSchemes);
router.get('/kyc/schemes/:id', verifyToken, kycController.getSchemeById);
router.post('/kyc/submit', verifyToken, kycController.submitKYC);
router.get('/kyc/status', verifyToken, kycController.getKYCStatus);

// 管理员路由
router.get('/admin/kyc/pending', verifyToken, verifyAdmin, kycController.getPendingSubmissions);
router.get('/admin/kyc/submissions/:id', verifyToken, verifyAdmin, kycController.getAdminSubmissionDetails);
router.post('/admin/kyc/review/:submissionId', verifyToken, verifyAdmin, kycController.reviewSubmission);
router.post('/admin/kyc/review/:submissionId/approve', verifyToken, verifyAdmin, kycController.approveSubmission);
router.post('/admin/kyc/review/:submissionId/reject', verifyToken, verifyAdmin, kycController.rejectSubmission);
router.post('/admin/kyc/schemes', verifyToken, verifyAdmin, kycController.createScheme);
router.get('/admin/dashboard/stats', verifyToken, verifyAdmin, kycController.getDashboardStats);
router.get('/admin/users', verifyToken, verifyAdmin, kycController.getAdminUsers);
router.get('/admin/kyc/schemes', verifyToken, verifyAdmin, kycController.getAdminSchemes);
router.get('/admin/kyc/schemes/:id', verifyToken, verifyAdmin, kycController.getSchemeById);
router.put('/admin/kyc/schemes/:id', verifyToken, verifyAdmin, kycController.updateScheme);
router.delete('/admin/kyc/schemes/:id', verifyToken, verifyAdmin, kycController.deleteScheme);

// 外部查询API
router.get('/verification/status', kycController.checkVerificationStatus);
router.get('/verification/details', verifyApiKey, kycController.getVerificationDetails);

module.exports = router; 