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

const sample = document.querySelector('#demo');
const button = document.querySelector('#refresh');
const state = document.querySelector('#state');
const notices = document.querySelector('#notices');

button.addEventListener('click', async () => {
  button.disabled = true;
  state.textContent = '加载中';
  notices.replaceChildren();
  const url = localUrl(sample.value);
  try {
    await simulateWait();
    const response = await fetch(url);
    if (!response.ok) throw new Error('读取失败');
    const { notices: records } = await response.json();
    for (const record of records) {
      const item = document.createElement('li');
      item.textContent = record.title + ' · ' + record.room;
      notices.append(item);
    }
    state.textContent = records.length ? `已加载 ${records.length} 条` : '暂无通知';
  } catch {
    state.textContent = '无法读取通知，请重试';
  } finally {
    button.disabled = false;
  }
});
