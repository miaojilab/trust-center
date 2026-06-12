import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = '页面加载中...', 
  fullScreen = false 
}) => {
  const sizeMap = {
    small: { spinner: '20px', text: '12px' },
    medium: { spinner: '40px', text: '16px' },
    large: { spinner: '60px', text: '20px' }
  };

  const currentSize = sizeMap[size];

  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        <div 
          className="loading-spinner"
          style={{ width: currentSize.spinner, height: currentSize.spinner }}
        ></div>
        <p className="loading-text" style={{ fontSize: currentSize.text }}>
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="loading-spinner-container">
      <div 
        className="loading-spinner"
        style={{ width: currentSize.spinner, height: currentSize.spinner }}
      ></div>
      {text && (
        <p className="loading-text" style={{ fontSize: currentSize.text }}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
