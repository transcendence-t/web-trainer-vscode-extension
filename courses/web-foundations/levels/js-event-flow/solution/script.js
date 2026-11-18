const pad = document.querySelector('#pad');
const button = document.querySelector('#tap');
const trace = document.querySelector('#trace');
const steps = [];
pad.addEventListener('click', () => steps.push('outer layer capture'), { capture: true });
button.addEventListener('click', () => steps.push('button'));
pad.addEventListener('click', () => {
  steps.push('outer layer bubbling');
  trace.textContent = steps.join(' → ');
  steps.length = 0;
});
