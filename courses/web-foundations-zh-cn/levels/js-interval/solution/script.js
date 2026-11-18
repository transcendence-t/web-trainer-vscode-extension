const start = document.querySelector('#start-sampling');
const stop = document.querySelector('#stop-sampling');
const status = document.querySelector('#sampling-status');
const log = document.querySelector('#sample-log');
let timerId;

function recordSample() {
  const entry = document.createElement('li');
  entry.textContent = '第 ' + (log.children.length + 1) + ' 次采样';
  log.append(entry);
  status.textContent = '正在采样';
}

start.addEventListener('click', () => {
  status.textContent = '正在采样';
  start.disabled = true;
  stop.disabled = false;
  timerId = setInterval(recordSample, 200);
});

stop.addEventListener('click', () => {
  clearInterval(timerId);
  status.textContent = '已停止采样';
  start.disabled = false;
  stop.disabled = true;
});
