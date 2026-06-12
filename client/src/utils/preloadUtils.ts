/**
 * 页面预加载工具
 * 用于实现智能的页面预加载策略，提升用户体验
 */

// 预加载队列
const preloadQueue: Array<() => Promise<any>> = [];
let isProcessing = false;

/**
 * 添加预加载任务到队列
 * @param preloadFn 预加载函数
 */
export const addToPreloadQueue = (preloadFn: () => Promise<any>) => {
  preloadQueue.push(preloadFn);
  
  if (!isProcessing) {
    processPreloadQueue();
  }
};

/**
 * 处理预加载队列
 */
const processPreloadQueue = async () => {
  if (isProcessing || preloadQueue.length === 0) return;
  
  isProcessing = true;
  
  try {
    // 使用 requestIdleCallback 在浏览器空闲时执行预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(async () => {
        while (preloadQueue.length > 0) {
          const preloadFn = preloadQueue.shift();
          if (preloadFn) {
            try {
              await preloadFn();
            } catch (error) {
              console.warn('预加载失败:', error);
            }
          }
        }
        isProcessing = false;
      });
    } else {
      // 降级处理：使用 setTimeout 模拟空闲时间
      setTimeout(async () => {
        while (preloadQueue.length > 0) {
          const preloadFn = preloadQueue.shift();
          if (preloadFn) {
            try {
              await preloadFn();
            } catch (error) {
              console.warn('预加载失败:', error);
            }
          }
        }
        isProcessing = false;
      }, 100);
    }
  } catch (error) {
    console.warn('预加载队列处理失败:', error);
    isProcessing = false;
  }
};

/**
 * 预加载页面组件
 * @param importFn 动态导入函数
 */
export const preloadPage = (importFn: () => Promise<any>) => {
  addToPreloadQueue(importFn);
};

/**
 * 智能预加载策略
 * 根据用户行为预测可能访问的页面
 */
export const smartPreload = {
  // 预加载仪表板相关页面
  dashboard: () => {
    preloadPage(() => import('../pages/Dashboard'));
    preloadPage(() => import('../pages/SchemeList'));
  },
  
  // 预加载方案相关页面
  schemes: () => {
    preloadPage(() => import('../pages/SchemeList'));
    preloadPage(() => import('../pages/SchemeDetail'));
  },
  
  // 预加载提交相关页面
  submission: () => {
    preloadPage(() => import('../pages/SubmissionForm'));
    preloadPage(() => import('../pages/SubmissionStatus'));
  },
  
  // 预加载管理员页面
  admin: () => {
    preloadPage(() => import('../pages/admin/AdminDashboard'));
    preloadPage(() => import('../pages/admin/AdminPendingList'));
    preloadPage(() => import('../pages/admin/AdminSchemeList'));
  }
};

/**
 * 清理预加载队列
 */
export const clearPreloadQueue = () => {
  preloadQueue.length = 0;
  isProcessing = false;
};
