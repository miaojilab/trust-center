import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { kycAPI } from '../services/api';
import { KYCScheme, KYCField } from '../types';
import KYCFormField from '../components/forms/KYCFormField';
import MainLayout from '../components/layout/MainLayout';
import { FileData, FieldValue } from '../components/forms/KYCFormField';

const SubmissionForm: React.FC = () => {
  const { schemeId } = useParams<{ schemeId: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheme, setScheme] = useState<KYCScheme | null>(null);
  const [formData, setFormData] = useState<Record<string, FieldValue>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchScheme = async () => {
      if (!schemeId) {
        setError('无效的方案ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await kycAPI.getSchemeById(parseInt(schemeId));
        
        if (response.success && response.data) {
          // 存储原始字段名到修改后字段名的映射
          const originalToModifiedNameMap: Record<string, string> = {};
          
          // 检查并确保所有字段的name属性都是唯一的
          const uniqueFields = response.data.fields?.map((field: KYCField, index: number) => {
            // 保存原始字段名
            const originalName = field.name;
            
            // 如果字段没有name或name为空，则使用id或生成一个唯一名称
            if (!field.name || field.name.trim() === '') {
              const newName = field.id || `field_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              originalToModifiedNameMap[originalName] = newName;
              return {
                ...field,
                name: newName,
                originalName // 保存原始字段名
              };
            }
            return field;
          });
          
          // 检查是否有重复的name属性
          const nameFrequency: Record<string, number> = {};
          
          uniqueFields.forEach((field: KYCField) => {
            if (nameFrequency[field.name]) {
              nameFrequency[field.name]++;
            } else {
              nameFrequency[field.name] = 1;
            }
          });
          
          // 如果有重复名称，为其添加后缀确保唯一性
          const deduplicatedFields = uniqueFields.map((field: KYCField) => {
            if (nameFrequency[field.name] > 1) {
              // 如果是重复名称，添加一个唯一的后缀
              const originalName = field.originalName || field.name;
              const newName = `${field.name}_${field.id || Date.now().toString(36)}`;
              console.log(`检测到重复字段名"${field.name}"，更新为"${newName}"`);
              
              // 保存映射关系
              originalToModifiedNameMap[originalName] = newName;
              
              return { 
                ...field, 
                name: newName,
                originalName
              };
            }
            
            // 保存映射关系（没有更改的也保存一份）
            const originalName = field.originalName || field.name;
            if (!originalToModifiedNameMap[originalName]) {
              originalToModifiedNameMap[originalName] = field.name;
            }
            
            return field;
          });
          
          // 在方案数据中保存映射关系，以便提交时使用
          const updatedScheme = {
            ...response.data,
            fields: deduplicatedFields,
            fieldNameMap: originalToModifiedNameMap
          };
          
          setScheme(updatedScheme);
          
          // 初始化表单数据
          const initialData: Record<string, any> = {};
          updatedScheme.fields.forEach((field: KYCField) => {
            initialData[field.name] = '';
          });
          setFormData(initialData);
        } else {
          setError('获取认证方案详情失败');
        }
      } catch (error) {
        console.error('获取方案详情失败:', error);
        setError('加载数据时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [schemeId]);

  const handleFieldChange = (name: string, value: FieldValue) => {
    // 更新表单数据
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    // 清除字段错误
    if (fieldErrors[name]) {
      setFieldErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    const currentFields = getCurrentStepFields();
    if (validateFields(currentFields)) {
      if (activeStep === steps.length - 1) {
        // 最后一步，打开确认对话框
        setConfirmOpen(true);
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setConfirmOpen(false);
    
    try {
      setSubmitting(true);
      
      // 将表单数据从修改后的字段名转换回原始字段名
      const originalFormData: Record<string, FieldValue> = {};
      
      if (scheme && scheme.fieldNameMap) {
        // 创建修改后字段名到原始字段名的反向映射
        const modifiedToOriginalNameMap: Record<string, string> = {};
        Object.entries(scheme.fieldNameMap).forEach(([originalName, modifiedName]) => {
          modifiedToOriginalNameMap[modifiedName] = originalName;
        });
        
        // 使用反向映射将数据转换回原始字段名格式
        Object.entries(formData).forEach(([modifiedName, value]) => {
          const originalName = modifiedToOriginalNameMap[modifiedName] || modifiedName;
          originalFormData[originalName] = value;
        });
        
        console.log('提交数据 - 原始格式:', originalFormData);
        console.log('提交数据 - 修改后格式:', formData);
      } else {
        // 如果没有映射关系，直接使用当前数据
        Object.assign(originalFormData, formData);
      }
      
      const response = await kycAPI.submitKYC(parseInt(schemeId!), originalFormData);
      
      if (response.success) {
        // 提交成功，跳转到状态页
        navigate('/status', { state: { success: true, message: '认证信息提交成功，等待审核' } });
      } else {
        // 显示后端返回的具体错误信息
        setErrorMessage(response.message || '提交失败，请稍后重试');
        setErrorDialogOpen(true);
        setError(`提交失败: ${response.message}`);
      }
    } catch (error: any) {
      console.error('提交认证信息失败:', error);
      
      // 提取错误信息并显示给用户
      let errorMsg = '提交数据时发生错误';
      
      // 从Axios错误响应中提取错误信息
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        errorMsg = responseData.message || errorMsg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setErrorDialogOpen(true);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const validateFields = (fields: KYCField[]) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field.name];
      
      // 必填字段验证
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors[field.name] = `${field.label}是必填项`;
        isValid = false;
        return;
      }

      // 电子邮件验证
      if (field.type === 'email' && value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.name] = '请输入有效的电子邮箱地址';
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  // 将字段分组为步骤
  const getFieldGroups = (): KYCField[][] => {
    if (!scheme?.fields) return [];
    
    // 这里简单地将字段每3个分为一组
    // 实际项目中可能需要根据字段类型或其他规则进行分组
    const groups: KYCField[][] = [];
    const fieldsPerStep = 3;
    
    for (let i = 0; i < scheme.fields.length; i += fieldsPerStep) {
      groups.push(scheme.fields.slice(i, i + fieldsPerStep));
    }
    
    return groups;
  };

  const fieldGroups = getFieldGroups();
  const steps = fieldGroups.map((_, index) => `步骤 ${index + 1}`);

  const getCurrentStepFields = (): KYCField[] => {
    return fieldGroups[activeStep] || [];
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !scheme) {
    return (
      <MainLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || '找不到指定的认证方案'}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/schemes')}
        >
          返回方案列表
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {scheme.name} - 信息提交
        </Typography>
        <Typography variant="body1" color="text.secondary">
          请按照要求填写以下信息，完成认证流程。
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={`step-${index}`}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {`步骤 ${activeStep + 1}: 填写${activeStep === 0 ? '基本' : '其他'}信息`}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {getCurrentStepFields().map((field, index) => (
          <KYCFormField
            key={`field-${activeStep}-${index}-${field.id || field.name}`}
            field={field}
            value={formData[field.name]}
            onChange={handleFieldChange}
            error={fieldErrors[field.name]}
          />
        ))}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          onClick={activeStep === 0 ? () => navigate(`/schemes/${schemeId}`) : handleBack}
          startIcon={<BackIcon />}
          disabled={submitting}
        >
          {activeStep === 0 ? '返回详情' : '上一步'}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={activeStep === steps.length - 1 ? <SendIcon /> : <SaveIcon />}
          disabled={submitting}
        >
          {activeStep === steps.length - 1 ? '提交认证' : '下一步'}
        </Button>
      </Box>

      {/* 确认对话框 */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>确认提交</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要提交这些认证信息吗？提交后将等待管理员审核。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>取消</Button>
          <Button onClick={handleSubmit} variant="contained" autoFocus>
            确认提交
          </Button>
        </DialogActions>
      </Dialog>

      {/* 错误对话框 */}
      <Dialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
      >
        <DialogTitle>提交失败</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default SubmissionForm; 