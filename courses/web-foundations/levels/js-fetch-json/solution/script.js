const dataset = document.querySelector('#dataset');
const events = document.querySelector('#events');
const notice = document.querySelector('#notice');

document.querySelector('#load').addEventListener('click', async () => {
  events.replaceChildren();
  try {
    const response = await fetch(dataset.value);
    if (!response.ok) throw new Error('读取失败');
    const { activities } = await response.json();
    for (const name of activities) {
      const item = document.createElement('li');
      item.textContent = name;
      events.append(item);
    }
    notice.textContent = activities.length ? '活动已更新' : '暂无活动';
  } catch {
    notice.textContent = '数据无法读取';
  }
});
