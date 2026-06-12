/**
 * 性能监控工具
 * 用于跟踪页面加载时间和性能指标
 */

interface PerformanceMetrics {
  pageLoadTime: number;
  componentLoadTime: number;
  totalLoadTime: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * 开始监控页面加载
   * @param pageName 页面名称
   */
  startPageLoad(pageName: string): void {
    const startTime = performance.now();
    this.startTimes.set(`page_${pageName}`, startTime);
    
    // 记录页面加载开始
    if (performance.mark) {
      performance.mark(`page-load-start-${pageName}`);
    }
  }

  /**
   * 完成页面加载监控
   * @param pageName 页面名称
   */
  completePageLoad(pageName: string): void {
    const startTime = this.startTimes.get(`page_${pageName}`);
    if (!startTime) return;

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // 记录页面加载完成
    if (performance.mark) {
      performance.mark(`page-load-end-${pageName}`);
      performance.measure(`page-load-${pageName}`, `page-load-start-${pageName}`, `page-load-end-${pageName}`);
    }

    this.metrics.set(pageName, {
      pageLoadTime: loadTime,
      componentLoadTime: 0,
      totalLoadTime: loadTime,
      timestamp: Date.now()
    });

    this.startTimes.delete(`page_${pageName}`);
    
    // 记录性能数据到控制台（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`页面 ${pageName} 加载完成，耗时: ${loadTime.toFixed(2)}ms`);
    }

    // 发送性能数据到分析服务（生产环境）
    if (process.env.NODE_ENV === 'production') {
      this.sendMetricsToAnalytics(pageName, loadTime);
    }
  }

  /**
   * 开始监控组件加载
   * @param componentName 组件名称
   */
  startComponentLoad(componentName: string): void {
    const startTime = performance.now();
    this.startTimes.set(`component_${componentName}`, startTime);
  }

  /**
   * 完成组件加载监控
   * @param componentName 组件名称
   */
  completeComponentLoad(componentName: string): void {
    const startTime = this.startTimes.get(`component_${componentName}`);
    if (!startTime) return;

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    this.startTimes.delete(`component_${componentName}`);
    
    // 记录组件加载时间
    if (process.env.NODE_ENV === 'development') {
      console.log(`组件 ${componentName} 加载完成，耗时: ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * 获取页面性能指标
   * @param pageName 页面名称
   */
  getPageMetrics(pageName: string): PerformanceMetrics | undefined {
    return this.metrics.get(pageName);
  }

  /**
   * 获取所有性能指标
   */
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * 计算平均加载时间
   */
  getAverageLoadTime(): number {
    const metrics = Array.from(this.metrics.values());
    if (metrics.length === 0) return 0;

    const totalTime = metrics.reduce((sum, metric) => sum + metric.pageLoadTime, 0);
    return totalTime / metrics.length;
  }

  /**
   * 清理性能数据
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * 发送性能数据到分析服务
   * @param pageName 页面名称
   * @param loadTime 加载时间
   */
  private sendMetricsToAnalytics(pageName: string, loadTime: number): void {
    try {
      // 这里可以集成实际的分析服务，如 Google Analytics、Mixpanel 等
      if (navigator.sendBeacon) {
        const data = {
          type: 'performance',
          page: pageName,
          loadTime: loadTime,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        };
        
        navigator.sendBeacon('/api/analytics/performance', JSON.stringify(data));
      }
    } catch (error) {
      console.warn('发送性能数据失败:', error);
    }
  }

  /**
   * 监控路由变化
   * @param to 目标路由
   * @param from 来源路由
   */
  monitorRouteChange(to: string, from?: string): void {
    if (from) {
      // 完成前一个页面的加载监控
      const fromPageName = this.extractPageName(from);
      if (fromPageName) {
        this.completePageLoad(fromPageName);
      }
    }

    // 开始新页面的加载监控
    const toPageName = this.extractPageName(to);
    if (toPageName) {
      this.startPageLoad(toPageName);
    }
  }

  /**
   * 从路由路径提取页面名称
   * @param path 路由路径
   */
  private extractPageName(path: string): string {
    // 移除查询参数和哈希
    const cleanPath = path.split('?')[0].split('#')[0];
    
    // 提取页面名称
    if (cleanPath === '/') return 'dashboard';
    if (cleanPath.startsWith('/admin')) return 'admin';
    if (cleanPath.startsWith('/schemes')) return 'schemes';
    if (cleanPath.startsWith('/submit')) return 'submission';
    if (cleanPath.startsWith('/status')) return 'status';
    
    return cleanPath.slice(1) || 'dashboard';
  }
}

// 创建单例实例
export const performanceMonitor = new PerformanceMonitor();

// 导出便捷方法
export const {
  startPageLoad,
  completePageLoad,
  startComponentLoad,
  completeComponentLoad,
  getPageMetrics,
  getAllMetrics,
  getAverageLoadTime,
  clearMetrics,
  monitorRouteChange
} = performanceMonitor;
