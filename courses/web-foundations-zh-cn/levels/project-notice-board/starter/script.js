const fixtures = {
  main: { notices: [
    { title: '采集体验', room: '摄影室' },
    { title: '<复核>购置清单', room: '设备库' },
  ] },
  empty: { notices: [] },
};

function localUrl(kind) {
  if (kind === 'error') return 'data:application/json,%7B';
  return 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fixtures[kind]));
}

function simulateWait() {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

// 编写页面的加载与重试逻辑。
