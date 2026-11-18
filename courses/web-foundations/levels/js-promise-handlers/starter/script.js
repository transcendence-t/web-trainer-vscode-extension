function askDesk(isAvailable) {
  if (isAvailable) return Promise.resolve('窗口 2');
  return Promise.reject(new Error('暂时无法分配'));
}

// 给按钮绑定异步操作。
