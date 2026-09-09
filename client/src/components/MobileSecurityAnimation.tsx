import React, { useRef, useEffect } from 'react';

interface MobileSecurityAnimationProps {
  width?: number;
  height?: number;
  color?: string;
}

const MobileSecurityAnimation: React.FC<MobileSecurityAnimationProps> = ({
  width = 120,
  height = 120,
  color = '#2563eb'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // 简化的动画绘制函数，针对移动设备优化
  const drawAnimation = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 初始化开始时间
    if (startTimeRef.current === 0) {
      startTimeRef.current = timestamp;
    }

    // 计算动画时间
    const elapsed = timestamp - startTimeRef.current;
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算中心点
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 计算缩放因子，在0.95和1.05之间脉动
    const scale = 0.95 + 0.1 * Math.sin(elapsed * 0.001);
    
    // 绘制盾牌形状
    drawShield(ctx, centerX, centerY, Math.min(width, height) * 0.4 * scale, elapsed);
    
    // 继续动画循环
    requestRef.current = requestAnimationFrame(drawAnimation);
  };

  // 绘制盾牌
  const drawShield = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    radius: number, 
    elapsed: number
  ) => {
    // 保存当前绘图状态
    ctx.save();
    
    // 盾牌轮廓
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    
    // 创建渐变填充
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.3,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, `rgba(37, 99, 235, 0.9)`);
    gradient.addColorStop(1, `rgba(37, 99, 235, 0.6)`);
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(37, 99, 235, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    
    // 绘制外环
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制内部锁图标
    const lockSize = radius * 0.6;
    drawLock(ctx, centerX, centerY, lockSize, elapsed);
    
    // 恢复绘图状态
    ctx.restore();
  };
  
  // 绘制锁图标
  const drawLock = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    size: number, 
    elapsed: number
  ) => {
    ctx.save();
    
    // 亮度脉动
    const brightness = 0.7 + 0.3 * Math.sin(elapsed * 0.002);
    
    // 锁的尺寸和位置
    const lockWidth = size * 0.7;
    const lockHeight = size * 0.8;
    const lockX = centerX - lockWidth / 2;
    const lockY = centerY - lockHeight / 2 - size * 0.05; // 稍微上移一点
    
    // 绘制锁的拱形顶部
    ctx.beginPath();
    const archRadius = lockWidth * 0.4;
    ctx.arc(
      centerX, 
      lockY + size * 0.2, 
      archRadius, 
      Math.PI, 
      0
    );
    
    // 使用渐变色
    const archGradient = ctx.createLinearGradient(
      centerX - archRadius, 
      lockY + size * 0.2 - archRadius / 2, 
      centerX + archRadius, 
      lockY + size * 0.2 + archRadius / 2
    );
    archGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * brightness})`);
    archGradient.addColorStop(0.5, `rgba(220, 220, 220, ${0.7 * brightness})`);
    archGradient.addColorStop(1, `rgba(255, 255, 255, ${0.9 * brightness})`);
    
    ctx.strokeStyle = archGradient;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 锁主体
    const bodyWidth = lockWidth * 0.8;
    const bodyHeight = lockHeight * 0.55;
    const bodyX = centerX - bodyWidth / 2;
    const bodyY = lockY + size * 0.2; // 与弧顶部对齐
    const cornerRadius = bodyWidth * 0.2;
    
    // 绘制圆角矩形
    ctx.beginPath();
    ctx.moveTo(bodyX + cornerRadius, bodyY);
    ctx.lineTo(bodyX + bodyWidth - cornerRadius, bodyY);
    ctx.arcTo(bodyX + bodyWidth, bodyY, bodyX + bodyWidth, bodyY + cornerRadius, cornerRadius);
    ctx.lineTo(bodyX + bodyWidth, bodyY + bodyHeight - cornerRadius);
    ctx.arcTo(bodyX + bodyWidth, bodyY + bodyHeight, bodyX + bodyWidth - cornerRadius, bodyY + bodyHeight, cornerRadius);
    ctx.lineTo(bodyX + cornerRadius, bodyY + bodyHeight);
    ctx.arcTo(bodyX, bodyY + bodyHeight, bodyX, bodyY + bodyHeight - cornerRadius, cornerRadius);
    ctx.lineTo(bodyX, bodyY + cornerRadius);
    ctx.arcTo(bodyX, bodyY, bodyX + cornerRadius, bodyY, cornerRadius);
    ctx.closePath();
    
    // 锁主体渐变
    const bodyGradient = ctx.createLinearGradient(
      bodyX, 
      bodyY, 
      bodyX + bodyWidth, 
      bodyY + bodyHeight
    );
    bodyGradient.addColorStop(0, `rgba(210, 210, 210, ${0.7 * brightness})`);
    bodyGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.9 * brightness})`);
    bodyGradient.addColorStop(1, `rgba(210, 210, 210, ${0.7 * brightness})`);
    
    ctx.fillStyle = bodyGradient;
    // 添加阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fill();
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * brightness})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 锁孔
    ctx.shadowColor = 'transparent'; // 移除阴影
    ctx.beginPath();
    
    // 钥匙孔上部分(圆形)
    const keyHoleX = centerX;
    const keyHoleY = bodyY + bodyHeight * 0.4;
    const keyHoleRadius = bodyWidth * 0.15;
    
    ctx.arc(keyHoleX, keyHoleY, keyHoleRadius, 0, Math.PI * 2);
    
    // 钥匙孔下部分(梯形)
    const slotWidth = keyHoleRadius * 0.8;
    const slotHeight = keyHoleRadius * 1.5;
    
    ctx.moveTo(keyHoleX - slotWidth / 2, keyHoleY + keyHoleRadius);
    ctx.lineTo(keyHoleX - slotWidth / 3, keyHoleY + keyHoleRadius + slotHeight);
    ctx.lineTo(keyHoleX + slotWidth / 3, keyHoleY + keyHoleRadius + slotHeight);
    ctx.lineTo(keyHoleX + slotWidth / 2, keyHoleY + keyHoleRadius);
    
    // 填充钥匙孔
    const keyholeGradient = ctx.createLinearGradient(
      keyHoleX - keyHoleRadius, 
      keyHoleY - keyHoleRadius, 
      keyHoleX + keyHoleRadius, 
      keyHoleY + keyHoleRadius + slotHeight
    );
    keyholeGradient.addColorStop(0, 'rgba(30, 30, 30, 0.9)');
    keyholeGradient.addColorStop(0.7, 'rgba(70, 70, 70, 0.8)');
    keyholeGradient.addColorStop(1, 'rgba(20, 20, 20, 0.9)');
    
    ctx.fillStyle = keyholeGradient;
    ctx.fill();
    
    // 添加高光
    ctx.beginPath();
    ctx.arc(
      bodyX + bodyWidth * 0.25, 
      bodyY + bodyHeight * 0.2, 
      bodyWidth * 0.1, 
      0, 
      Math.PI * 2
    );
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * brightness})`;
    ctx.fill();
    
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 设置Canvas尺寸，考虑设备像素比
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // 根据设备像素比调整绘图缩放
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    // 开始动画循环
    requestRef.current = requestAnimationFrame(drawAnimation);
    
    // 清理函数
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: `${width}px`,
        height: `${height}px`
      }}
    />
  );
};

export default MobileSecurityAnimation; 