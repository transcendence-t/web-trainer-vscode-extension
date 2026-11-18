document.querySelector('#run').addEventListener('click', () => {
  const steps = [];
  function record(step) {
    steps.push(step);
    document.querySelector('#order').textContent = steps.join(' → ');
  }
  setTimeout(() => record('计时器'), 0);
  Promise.resolve().then(() => record('微任务'));
  record('同步');
});
