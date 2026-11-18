const start = document.querySelector('#start-sampling');
const stop = document.querySelector('#stop-sampling');
const status = document.querySelector('#sampling-status');
const log = document.querySelector('#sample-log');
let timerId;

function recordSample() {
  const entry = document.createElement('li');
  entry.textContent = 'No. ' + (log.children.length + 1) + ' samples';
  log.append(entry);
  status.textContent = 'is sampling';
}

start.addEventListener('click', () => {
  status.textContent = 'is sampling';
  start.disabled = true;
  stop.disabled = false;
  timerId = setInterval(recordSample, 200);
});

stop.addEventListener('click', () => {
  clearInterval(timerId);
  status.textContent = 'Sampling has stopped';
  start.disabled = false;
  stop.disabled = true;
});
