import React, { lazy, Suspense, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyComponentProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

/**
 * 通用懒加载组件包装器
 * 用于在页面内部实现组件的懒加载
 */
const LazyComponent: React.FC<LazyComponentProps> = ({ 
  component, 
  fallback,
  size = 'medium',
  text = '组件加载中...'
}) => {
  const LazyComponent = lazy(component);
  
  const defaultFallback = <LoadingSpinner size={size} text={text} />;
  
  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent />
    </Suspense>
  );
};

export default LazyComponent;
