const pad = document.querySelector('#pad');
const button = document.querySelector('#tap');
const trace = document.querySelector('#trace');
const steps = [];
pad.addEventListener('click', () => steps.push('外层捕获'), { capture: true });
button.addEventListener('click', () => steps.push('按钮'));
pad.addEventListener('click', () => {
  steps.push('外层冒泡');
  trace.textContent = steps.join(' → ');
  steps.length = 0;
});
