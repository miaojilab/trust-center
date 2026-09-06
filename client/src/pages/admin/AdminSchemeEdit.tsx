import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, TextField, Paper, FormControlLabel, Switch, Divider, IconButton, Card, CardContent, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, DragHandle as DragHandleIcon, Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { adminAPI } from '../../services/api';
import MainLayout from '../../components/layout/MainLayout';
import { KYCScheme, KYCField } from '../../types';

// 字段类型选项
const fieldTypes = [
  { value: 'text', label: '文本' },
  { value: 'email', label: '电子邮件' },
  { value: 'phone', label: '电话号码' },
  { value: 'date', label: '日期' },
  { value: 'select', label: '选择框' },
  { value: 'image', label: '图片上传' },
  { value: 'file', label: '文件上传' }
];

// 创建空字段
const createEmptyField = (): KYCField => {
  const id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    name: id, // 使用相同的值作为name，确保前后端一致性
    label: '',
    type: 'text',
    required: false,
    description: '',
    options: [],
    validations: {}
  };
};

const AdminSchemeEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 表单状态
  const [scheme, setScheme] = useState<KYCScheme | null>(null);
  
  // 加载状态
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // 加载方案详情
  useEffect(() => {
    const fetchScheme = async () => {
      if (!id) {
        setError('无效的方案ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await adminAPI.getSchemeById(parseInt(id));
        if (response.success && response.data) {
          // 将 status 转换为 isActive 以便表单使用
          const schemeData = response.data;
          const schemeWithIsActive = {
            ...schemeData,
            isActive: schemeData.status === 'active',
            // 确保每个字段至少有空选项数组
            fields: schemeData.fields.map(field => ({
              ...field,
              options: field.options || []
            }))
          };
          setScheme(schemeWithIsActive);
        } else {
          setError(response.message || '加载方案详情失败');
        }
      } catch (error) {
        console.error('加载方案详情失败:', error);
        setError('无法加载认证方案详情');
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [id]);
  
  // 处理方案基本信息变更
  const handleSchemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!scheme) return;
    
    const { name, value, checked } = e.target;
    setScheme(prev => prev ? {
      ...prev,
      [name]: name === 'isActive' ? checked : value
    } : null);
  };
  
  // 处理添加新字段
  const handleAddField = () => {
    if (!scheme) return;
    
    setScheme(prev => prev ? {
      ...prev,
      fields: [...prev.fields, createEmptyField()]
    } : null);
  };
  
  // 处理删除字段
  const handleDeleteField = (index: number) => {
    if (!scheme) return;
    
    setScheme(prev => prev ? {
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    } : null);
  };
  
  // 处理字段属性变更
  const handleFieldChange = (index: number, field: Partial<KYCField>) => {
    if (!scheme) return;
    
    setScheme(prev => {
      if (!prev) return null;
      
      const updatedFields = [...prev.fields];
      const currentField = updatedFields[index];
      
      // 如果更新了label且name为空或者与id相同模式，则同时更新name为一致值
      if (field.label && (!currentField.name || currentField.name === currentField.id)) {
        // 生成基于label的name（英文小写，去除特殊字符，空格替换为下划线）
        const generatedName = field.label
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '_');
        
        // 确保name唯一（添加字段id的一部分）
        const uniqueName = `${generatedName}_${currentField.id?.split('_').pop() || ''}`;
        
        updatedFields[index] = { 
          ...currentField, 
          ...field,
          name: uniqueName
        };
      } else {
        updatedFields[index] = { ...currentField, ...field };
      }
      
      return {
        ...prev,
        fields: updatedFields
      };
    });
  };
  
  // 处理字段类型变更
  const handleFieldTypeChange = (index: number, event: SelectChangeEvent) => {
    if (!scheme) return;
    
    const newType = event.target.value as KYCField['type'];
    setScheme(prev => prev ? {
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === index ? { 
          ...f, 
          type: newType,
          // 如果类型变为select但没有选项，添加默认选项
          options: newType === 'select' && (!f.options || f.options.length === 0) 
            ? ['选项1', '选项2'] 
            : f.options
        } : f
      )
    } : null);
  };
  
  // 处理选项变更
  const handleOptionChange = (fieldIndex: number, optionIndex: number, value: string) => {
    if (!scheme) return;
    
    setScheme(prev => prev ? {
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i !== fieldIndex) return f;
        
        const updatedOptions = [...(f.options || [])];
        updatedOptions[optionIndex] = value;
        
        return {
          ...f,
          options: updatedOptions
        };
      })
    } : null);
  };
  
  // 处理添加选项
  const handleAddOption = (fieldIndex: number) => {
    if (!scheme) return;
    
    setScheme(prev => prev ? {
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i !== fieldIndex) return f;
        
        return {
          ...f,
          options: [...(f.options || []), `选项${(f.options?.length || 0) + 1}`]
        };
      })
    } : null);
  };
  
  // 处理删除选项
  const handleDeleteOption = (fieldIndex: number, optionIndex: number) => {
    if (!scheme) return;
    
    setScheme(prev => prev ? {
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i !== fieldIndex) return f;
        
        const updatedOptions = [...(f.options || [])];
        updatedOptions.splice(optionIndex, 1);
        
        return {
          ...f,
          options: updatedOptions
        };
      })
    } : null);
  };
  
  // 处理拖放排序
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !scheme) return;
    
    const reorderedFields = [...scheme.fields];
    const [movedField] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, movedField);
    
    setScheme(prev => prev ? {
      ...prev,
      fields: reorderedFields
    } : null);
  };
  
  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheme) return;
    
    // 表单验证
    if (!scheme.name || scheme.fields.some(f => !f.label)) {
      setError('请填写所有必填字段');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await adminAPI.updateScheme(
        parseInt(id as string),
        scheme.name, 
        scheme.description, 
        scheme.fields,
        scheme.isActive
      );
      
      if (response.success) {
        setSuccess(true);
        // 延迟导航，让用户看到成功消息
        setTimeout(() => {
          navigate('/admin/schemes', { state: { message: '已成功更新KYC方案' } });
        }, 1500);
      } else {
        setError(response.message || '更新方案失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      setError('更新方案时发生错误');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 返回列表
  const handleBack = () => {
    navigate('/admin/schemes');
  };
  
  // 加载中
  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  // 错误处理
  if (error && !scheme) {
    return (
      <MainLayout>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            编辑方案
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={handleBack}>
          返回列表
        </Button>
      </MainLayout>
    );
  }
  
  if (!scheme) {
    return (
      <MainLayout>
        <Alert severity="error">方案不存在</Alert>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          编辑认证方案
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          更新成功！正在跳转...
        </Alert>
      )}
      
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          基本信息
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            required
            label="方案名称"
            name="name"
            value={scheme.name}
            onChange={handleSchemeChange}
            margin="normal"
            variant="outlined"
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="方案描述"
            name="description"
            value={scheme.description}
            onChange={handleSchemeChange}
            margin="normal"
            variant="outlined"
            placeholder="描述此认证方案的用途和要求..."
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={scheme.isActive}
                onChange={handleSchemeChange}
                name="isActive"
                color="primary"
              />
            }
            label="启用此方案"
            sx={{ mt: 2 }}
          />
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            字段配置
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddField}
          >
            添加字段
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          拖拽调整字段顺序，为每个字段配置所需的属性。
        </Typography>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fields">
            {(provided) => (
              <Box
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {scheme.fields.map((field, index) => (
                  <Draggable 
                    key={field.id || `field-${index}`}
                    draggableId={field.id?.toString() || `field-${index}`}
                    index={index}
                  >
                    {(provided) => (
                      <Card 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{ mb: 2, position: 'relative' }}
                      >
                        <CardContent>
                          <Box 
                            {...provided.dragHandleProps}
                            sx={{ 
                              position: 'absolute', 
                              top: 10, 
                              right: 10, 
                              cursor: 'grab',
                              color: 'text.secondary'
                            }}
                          >
                            <DragHandleIcon />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">
                              字段 #{index + 1}
                            </Typography>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeleteField(index)}
                              sx={{ mr: 4 }}
                            >
                              删除
                            </Button>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                              <Box sx={{ flex: '1 1 300px' }}>
                                <TextField
                                  fullWidth
                                  required
                                  label="字段标签"
                                  value={field.label}
                                  onChange={(e) => 
                                    handleFieldChange(index, { label: e.target.value })
                                  }
                                  margin="normal"
                                />
                              </Box>
                              <Box sx={{ flex: '1 1 300px' }}>
                                <FormControl fullWidth margin="normal">
                                  <InputLabel>字段类型</InputLabel>
                                  <Select
                                    value={field.type}
                                    onChange={(e) => handleFieldTypeChange(index, e)}
                                    label="字段类型"
                                  >
                                    {fieldTypes.map(type => (
                                      <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>
                            </Box>
                            
                            <TextField
                              fullWidth
                              label="字段描述"
                              value={field.description || ''}
                              onChange={(e) => 
                                handleFieldChange(index, { description: e.target.value })
                              }
                              margin="normal"
                              placeholder="可选的字段说明或帮助文本"
                            />
                            
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={field.required || false}
                                  onChange={(e) => 
                                    handleFieldChange(index, { required: e.target.checked })
                                  }
                                  color="primary"
                                />
                              }
                              label="此字段为必填项"
                            />
                            
                            {field.type === 'select' && (
                              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mt: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  选项列表
                                </Typography>
                                
                                {field.options && field.options.map((option, optionIndex) => (
                                  <Box key={optionIndex} sx={{ display: 'flex', mb: 1 }}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      value={option}
                                      onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                                      placeholder={`选项 ${optionIndex + 1}`}
                                      variant="outlined"
                                      sx={{ mr: 1 }}
                                    />
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleDeleteOption(index, optionIndex)}
                                      disabled={(field.options?.length || 0) <= 1}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ))}
                                
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => handleAddOption(index)}
                                  sx={{ mt: 1 }}
                                >
                                  添加选项
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={submitting}
          >
            {submitting ? '保存中...' : '保存方案'}
          </Button>
        </Box>
      </Paper>
    </MainLayout>
  );
};

export default AdminSchemeEdit; 