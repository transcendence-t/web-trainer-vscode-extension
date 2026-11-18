const devices = ['USB 麦克风', 'USB 摄像头', '数码录音笔', '便携投影仪'];
const query = document.querySelector('#equipment-query');
const list = document.querySelector('#equipment-results');
const count = document.querySelector('#equipment-count');
const empty = document.querySelector('#equipment-empty');

function renderDevices(matches) {
  list.replaceChildren();
  for (const device of matches) {
    const row = document.createElement('li');
    row.textContent = device;
    list.append(row);
  }
  count.textContent = '找到 ' + matches.length + ' 件设备';
  empty.hidden = matches.length !== 0;
}

query.addEventListener('input', () => {
  const keyword = query.value.trim().toLowerCase();
  const matches = devices.filter((device) => device.toLowerCase().includes(keyword));
  renderDevices(matches);
});

renderDevices(devices);
