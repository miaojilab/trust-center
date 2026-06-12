import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragHandle as DragHandleIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
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

// 初始字段模板
const createEmptyField = (): KYCField => {
  const id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    name: id,
    label: '',
    type: 'text',
    required: false,
    description: '',
    options: [],
    validations: {}
  };
};

const AdminSchemeCreate: React.FC = () => {
  const navigate = useNavigate();
  
  // 表单状态
  const [scheme, setScheme] = useState<KYCScheme>({
    id: 0,
    name: '',
    description: '',
    isActive: true,
    fields: [createEmptyField()]
  });
  
  // 提交状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // 处理方案基本信息变更
  const handleSchemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setScheme(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
  };
  
  // 处理添加新字段
  const handleAddField = () => {
    setScheme(prev => ({
      ...prev,
      fields: [...prev.fields, createEmptyField()]
    }));
  };
  
  // 处理删除字段
  const handleDeleteField = (index: number) => {
    setScheme(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };
  
  // 处理字段属性变更
  const handleFieldChange = (index: number, field: Partial<KYCField>) => {
    setScheme(prev => {
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
    const newType = event.target.value as KYCField['type'];
    setScheme(prev => ({
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
    }));
  };
  
  // 处理选项变更
  const handleOptionChange = (fieldIndex: number, optionIndex: number, value: string) => {
    setScheme(prev => ({
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
    }));
  };
  
  // 处理添加选项
  const handleAddOption = (fieldIndex: number) => {
    setScheme(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i !== fieldIndex) return f;
        
        return {
          ...f,
          options: [...(f.options || []), `选项${(f.options?.length || 0) + 1}`]
        };
      })
    }));
  };
  
  // 处理删除选项
  const handleDeleteOption = (fieldIndex: number, optionIndex: number) => {
    setScheme(prev => ({
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
    }));
  };
  
  // 处理拖放排序
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const reorderedFields = [...scheme.fields];
    const [movedField] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, movedField);
    
    setScheme(prev => ({
      ...prev,
      fields: reorderedFields
    }));
  };
  
  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!scheme.name || scheme.fields.some(f => !f.label)) {
      setError('请填写所有必填字段');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 准备提交数据，去除临时ID
      const fieldsToSubmit = scheme.fields.map(field => {
        // 如果是临时ID (以temp-开头)，则移除ID以便服务器生成新ID
        const { id, ...rest } = field;
        if (id && typeof id === 'string' && id.startsWith('temp-')) {
          return rest;
        }
        return field;
      });
      
      const response = await adminAPI.createScheme(
        scheme.name, 
        scheme.description, 
        fieldsToSubmit
      );
      
      if (response.success) {
        setSuccess(true);
        // 延迟导航，让用户看到成功消息
        setTimeout(() => {
          navigate('/admin/schemes', { state: { message: '已成功创建KYC方案' } });
        }, 1500);
      } else {
        setError(response.message || '创建方案失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      setError('创建方案时发生错误');
    } finally {
      setLoading(false);
    }
  };
  
  // 返回列表
  const handleBack = () => {
    navigate('/admin/schemes');
  };
  
  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          创建认证方案
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          创建成功！正在跳转...
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
          <Droppable droppableId="fields" isDropDisabled={false}>
            {(provided) => (
              <Box
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {scheme.fields.map((field, index) => (
                  <Draggable 
                    key={field.id} 
                    draggableId={field.id || `temp-field-${index}`} 
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
                              right: 8, 
                              top: 8, 
                              cursor: 'grab',
                              color: 'text.secondary'
                            }}
                          >
                            <DragHandleIcon />
                          </Box>
                          
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteField(index)}
                            sx={{ position: 'absolute', right: 8, bottom: 8 }}
                            disabled={scheme.fields.length <= 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                          
                          <Typography variant="subtitle1" gutterBottom>
                            字段 #{index + 1}
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <TextField
                                fullWidth
                                label="描述文本"
                                value={field.description || ''}
                                onChange={(e) => 
                                  handleFieldChange(index, { description: e.target.value })
                                }
                                margin="normal"
                                placeholder="帮助用户理解如何填写此字段..."
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={field.required}
                                    onChange={(e) => 
                                      handleFieldChange(index, { required: e.target.checked })
                                    }
                                    color="primary"
                                  />
                                }
                                label="必填字段"
                              />
                            </Grid>
                            
                            {/* 选择框类型的选项设置 */}
                            {field.type === 'select' && (
                              <Grid size={{ xs: 12 }}>
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
                                        disabled={field.options && field.options.length <= 1}
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
                              </Grid>
                            )}
                          </Grid>
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
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading}
          >
            {loading ? '保存中...' : '保存方案'}
          </Button>
        </Box>
      </Paper>
    </MainLayout>
  );
};

export default AdminSchemeCreate; 