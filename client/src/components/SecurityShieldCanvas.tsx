import React, { useRef, useEffect } from 'react';

interface SecurityShieldCanvasProps {
  width?: number;
  height?: number;
  color?: string;
}

const SecurityShieldCanvas: React.FC<SecurityShieldCanvasProps> = ({
  width = 280,
  height = 280,
  color = '#1976d2'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // 绘制盾牌基本形状
  const drawShield = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    size: number, 
    time: number
  ) => {
    ctx.save();
    
    // 盾牌外形
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size * 0.5);
    ctx.bezierCurveTo(
      centerX + size * 0.4, centerY - size * 0.4,
      centerX + size * 0.4, centerY + size * 0.2,
      centerX, centerY + size * 0.5
    );
    ctx.bezierCurveTo(
      centerX - size * 0.4, centerY + size * 0.2,
      centerX - size * 0.4, centerY - size * 0.4,
      centerX, centerY - size * 0.5
    );
    
    // 创建盾牌渐变
    const gradient = ctx.createLinearGradient(
      centerX - size * 0.4, 
      centerY, 
      centerX + size * 0.4, 
      centerY
    );
    gradient.addColorStop(0, 'rgba(25, 118, 210, 0.6)');
    gradient.addColorStop(0.5, 'rgba(25, 118, 210, 0.9)');
    gradient.addColorStop(1, 'rgba(25, 118, 210, 0.7)');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(25, 118, 210, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fill();
    
    // 盾牌内部线条
    drawShieldInnerLines(ctx, centerX, centerY, size, time);
    
    // 盾牌边缘
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  };
  
  // 绘制盾牌内部的安全线路动画
  const drawShieldInnerLines = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    size: number, 
    time: number
  ) => {
    ctx.save();
    
    // 绘制盾牌中央的锁形图案
    drawLockSymbol(ctx, centerX, centerY, size * 0.3, time);
    
    // 动态粒子
    drawParticles(ctx, centerX, centerY, size, time);
    
    ctx.restore();
  };
  
  // 绘制锁形安全标志
  const drawLockSymbol = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    size: number,
    time: number
  ) => {
    ctx.save();
    
    // 锁的主体
    const lockWidth = size * 0.7;
    const lockHeight = size * 0.8;
    const lockY = centerY - lockHeight / 2 + size * 0.05;

    // 锁的弧度
    const arcRadius = lockWidth / 2;
    
    // 脉动效果
    const glowIntensity = 0.6 + 0.4 * Math.sin(time * 0.001);
    
    // 锁的主体矩形
    const lockBodyWidth = lockWidth * 0.8;
    const lockBodyHeight = lockHeight * 0.6;
    const lockBodyX = centerX - lockBodyWidth / 2;
    const lockBodyY = lockY + arcRadius * 0.8;
    
    // 绘制锁的拱形顶部
    ctx.beginPath();
    ctx.arc(
      centerX, 
      lockBodyY,
      arcRadius, 
      Math.PI, 
      Math.PI * 2
    );
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * glowIntensity})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 绘制锁体
    ctx.beginPath();
    ctx.roundRect(
      lockBodyX, 
      lockBodyY, 
      lockBodyWidth, 
      lockBodyHeight, 
      [0, 0, lockBodyWidth * 0.2, lockBodyWidth * 0.2]
    );
    
    const lockGradient = ctx.createLinearGradient(
      lockBodyX, 
      lockBodyY, 
      lockBodyX + lockBodyWidth, 
      lockBodyY + lockBodyHeight
    );
    lockGradient.addColorStop(0, `rgba(255, 255, 255, ${0.2 * glowIntensity})`);
    lockGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.3 * glowIntensity})`);
    lockGradient.addColorStop(1, `rgba(255, 255, 255, ${0.2 * glowIntensity})`);
    
    ctx.fillStyle = lockGradient;
    ctx.fill();
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * glowIntensity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 锁孔
    const keyHoleRadius = lockBodyWidth * 0.15;
    ctx.beginPath();
    ctx.arc(
      centerX, 
      lockBodyY + lockBodyHeight * 0.35, 
      keyHoleRadius, 
      0, 
      Math.PI * 2
    );
    
    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * glowIntensity})`;
    ctx.fill();
    
    // 锁孔的底部槽
    ctx.beginPath();
    ctx.moveTo(centerX, lockBodyY + lockBodyHeight * 0.35 + keyHoleRadius);
    ctx.lineTo(centerX, lockBodyY + lockBodyHeight * 0.35 + keyHoleRadius * 3);
    
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.5 * glowIntensity})`;
    ctx.lineWidth = keyHoleRadius * 0.6;
    ctx.stroke();
    
    // 亮光效果
    ctx.beginPath();
    ctx.arc(
      centerX - keyHoleRadius * 0.4, 
      lockBodyY + lockBodyHeight * 0.35 - keyHoleRadius * 0.4, 
      keyHoleRadius * 0.3, 
      0, 
      Math.PI * 2
    );
    
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * glowIntensity})`;
    ctx.fill();
    
    ctx.restore();
  };
  
  // 绘制动态运动的粒子
  const drawParticles = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    size: number, 
    time: number
  ) => {
    const particleCount = 8;
    const radiusOffset = size * 0.3;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 0.0005;
      const movingAngle = angle + time * speed;
      
      const x = centerX + Math.cos(movingAngle) * radiusOffset;
      const y = centerY + Math.sin(movingAngle) * radiusOffset;
      
      // 脉冲效果
      const pulseScale = 1 + 0.2 * Math.sin(time * 0.003 + i);
      
      ctx.beginPath();
      ctx.arc(x, y, 5 * pulseScale, 0, Math.PI * 2);
      
      // 特殊粒子使用不同颜色
      if (i % 4 === 0) {
        ctx.fillStyle = 'rgba(255, 193, 7, 0.8)'; // 金色粒子
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      }
      
      ctx.fill();
      
      // 添加连接线
      if (i > 0) {
        const prevAngle = ((i - 1) / particleCount) * Math.PI * 2;
        const prevMovingAngle = prevAngle + time * speed;
        const prevX = centerX + Math.cos(prevMovingAngle) * radiusOffset;
        const prevY = centerY + Math.sin(prevMovingAngle) * radiusOffset;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(prevX, prevY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + 0.1 * Math.sin(time * 0.002)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    
    // 连接最后一个和第一个粒子
    const firstAngle = 0;
    const lastAngle = ((particleCount - 1) / particleCount) * Math.PI * 2;
    
    const firstMovingAngle = firstAngle + time * 0.0005;
    const lastMovingAngle = lastAngle + time * 0.0005;
    
    const firstX = centerX + Math.cos(firstMovingAngle) * radiusOffset;
    const firstY = centerY + Math.sin(firstMovingAngle) * radiusOffset;
    
    const lastX = centerX + Math.cos(lastMovingAngle) * radiusOffset;
    const lastY = centerY + Math.sin(lastMovingAngle) * radiusOffset;
    
    ctx.beginPath();
    ctx.moveTo(firstX, firstY);
    ctx.lineTo(lastX, lastY);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + 0.1 * Math.sin(time * 0.002)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  
  // 绘制背景网格
  const drawGrid = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    time: number
  ) => {
    ctx.save();
    
    const gridSize = 30;
    const lineCount = Math.max(width, height) / gridSize;
    
    // 使用时间参数创建移动效果
    const offset = (time * 0.03) % gridSize;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    // 水平线
    for (let i = 0; i < lineCount; i++) {
      const y = i * gridSize + offset;
      
      if (y > height) continue;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // 垂直线
    for (let i = 0; i < lineCount; i++) {
      const x = i * gridSize + offset;
      
      if (x > width) continue;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  // 主动画循环
  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 确保缩放正确
    const displayRatio = window.devicePixelRatio || 1;
    const actualWidth = canvas.width / displayRatio;
    const actualHeight = canvas.height / displayRatio;
    
    // 绘制背景网格
    drawGrid(ctx, actualWidth, actualHeight, time);
    
    // 绘制盾牌 - 始终使用显示区域的实际尺寸
    const shieldSize = Math.min(actualWidth, actualHeight) * 0.7;
    drawShield(
      ctx, 
      actualWidth / 2,  // 确保盾牌绘制在Canvas的中心
      actualHeight / 2, 
      shieldSize, 
      time
    );
    
    // 继续动画循环
    animationRef.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 设置Canvas尺寸，考虑设备像素比
    const setCanvasSize = () => {
      // 获取设备像素比
      const dpr = window.devicePixelRatio || 1;
      
      // 设置Canvas的实际尺寸（考虑DPR）
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      // 设置Canvas的CSS尺寸
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    
    setCanvasSize();
    
    // 添加窗口大小变化监听，以确保在屏幕旋转或尺寸变化时重新调整
    const handleResize = () => {
      setCanvasSize();
    };
    
    window.addEventListener('resize', handleResize);
    
    // 启动动画
    animationRef.current = requestAnimationFrame(animate);
    
    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        display: 'block',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%'
      }} 
    />
  );
};

export default SecurityShieldCanvas; 