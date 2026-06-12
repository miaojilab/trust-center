import React from 'react';
import {
  TextField,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  FormHelperText,
  Button,
  Box,
  Typography,
  SelectChangeEvent
} from '@mui/material';
import { KYCField } from '../../types';

// 文件数据类型
export interface FileData {
  filename: string;
  type: string;
  size: number;
  data: string;
}

// 字段值类型
export type FieldValue = string | number | FileData | null | undefined;

interface KYCFormFieldProps {
  field: KYCField;
  value: FieldValue;
  onChange: (name: string, value: FieldValue) => void;
  error?: string;
}

const KYCFormField: React.FC<KYCFormFieldProps> = ({ field, value, onChange, error }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field.name, e.target.value);
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    onChange(field.name, e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // 获取base64编码的文件内容
        const base64Data = reader.result as string;
        onChange(field.name, {
          filename: file.name,
          type: file.type,
          size: file.size,
          data: base64Data
        });
      };
      reader.readAsDataURL(file);
    } else {
      onChange(field.name, null);
    }
  };

  // 将值转换为字符串，处理可能的undefined或null
  const getStringValue = (val: FieldValue): string => {
    if (val === null || val === undefined) return '';
    return typeof val === 'object' ? '' : String(val);
  };
  
  // 获取文件名（如果值是文件对象）
  const getFileName = (val: FieldValue): string => {
    if (val && typeof val === 'object' && 'filename' in val) {
      return val.filename;
    }
    return '未选择文件';
  };

  switch (field.type) {
    case 'text':
      return (
        <TextField
          fullWidth
          label={field.label}
          name={field.name}
          value={getStringValue(value)}
          onChange={handleChange}
          margin="normal"
          required={field.required}
          error={!!error}
          helperText={error || field.description}
        />
      );
    
    case 'email':
      return (
        <TextField
          fullWidth
          type="email"
          label={field.label}
          name={field.name}
          value={getStringValue(value)}
          onChange={handleChange}
          margin="normal"
          required={field.required}
          error={!!error}
          helperText={error || field.description}
        />
      );
    
    case 'number':
      return (
        <TextField
          fullWidth
          type="number"
          label={field.label}
          name={field.name}
          value={getStringValue(value)}
          onChange={handleChange}
          margin="normal"
          required={field.required}
          error={!!error}
          helperText={error || field.description}
        />
      );
    
    case 'date':
      return (
        <TextField
          fullWidth
          type="date"
          label={field.label}
          name={field.name}
          value={getStringValue(value)}
          onChange={handleChange}
          margin="normal"
          required={field.required}
          error={!!error}
          helperText={error || field.description}
          InputLabelProps={{
            shrink: true,
          }}
        />
      );
    
    case 'select':
      return (
        <FormControl
          fullWidth
          margin="normal"
          required={field.required}
          error={!!error}
        >
          <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel>
          <Select
            labelId={`${field.name}-label`}
            name={field.name}
            value={getStringValue(value)}
            onChange={handleSelectChange}
            label={field.label}
          >
            {field.options?.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
          {(error || field.description) && (
            <FormHelperText>{error || field.description}</FormHelperText>
          )}
        </FormControl>
      );
    
    case 'file':
      return (
        <Box sx={{ mt: 2, mb: 1 }}>
          <InputLabel
            sx={{ mb: 1 }}
            error={!!error}
            required={field.required}
          >
            {field.label}
          </InputLabel>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              sx={{ minWidth: '120px' }}
            >
              选择文件
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            
            <Typography variant="body2">
              {getFileName(value)}
            </Typography>
          </Box>
          
          {(error || field.description) && (
            <FormHelperText error={!!error}>
              {error || field.description}
            </FormHelperText>
          )}
        </Box>
      );
    
    default:
      return (
        <TextField
          fullWidth
          label={field.label}
          name={field.name}
          value={getStringValue(value)}
          onChange={handleChange}
          margin="normal"
          required={field.required}
          error={!!error}
          helperText={error || field.description}
        />
      );
  }
};

export default KYCFormField; 