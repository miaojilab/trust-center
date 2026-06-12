import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * 错误边界组件
 * 用于捕获和处理懒加载组件可能出现的错误
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新状态，下次渲染时显示错误UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('组件错误:', error, errorInfo);
    
    // 调用错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // 自定义错误UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>页面加载失败</h3>
            <p>抱歉，页面加载时出现了问题。请尝试刷新页面或联系技术支持。</p>
            <button 
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              刷新页面
            </button>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="retry-button"
            >
              重试加载
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
