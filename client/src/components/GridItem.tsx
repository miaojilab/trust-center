import React from 'react';
import { Grid, GridProps } from '@mui/material';

export interface GridItemProps extends Omit<GridProps, 'container'> {
  xs?: number | "auto" | "grow";
  sm?: number | "auto" | "grow";  
  md?: number | "auto" | "grow";
  lg?: number | "auto" | "grow";
  xl?: number | "auto" | "grow";
}

/**
 * GridItem组件 - 包装Grid组件,提供向下兼容的API
 * 将旧的xs, sm, md等属性转换为新的size属性格式
 */
const GridItem: React.FC<GridItemProps> = ({ 
  xs, 
  sm, 
  md, 
  lg, 
  xl, 
  children, 
  ...props 
}) => {
  // 构建size对象
  const size: Record<string, number | string> = {};
  
  if (xs !== undefined) size.xs = xs;
  if (sm !== undefined) size.sm = sm;
  if (md !== undefined) size.md = md;
  if (lg !== undefined) size.lg = lg;
  if (xl !== undefined) size.xl = xl;

  // 如果只有xs属性且是数字,可以简化为单一值
  const sizeValue = 
    Object.keys(size).length === 1 && 
    size.xs !== undefined &&
    (typeof size.xs === 'number' || size.xs === 'grow' || size.xs === 'auto')
      ? size.xs
      : size;

  return (
    <Grid {...props} size={Object.keys(size).length ? sizeValue : undefined}>
      {children}
    </Grid>
  );
};

export default GridItem; 