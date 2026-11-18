document.querySelector('#run').addEventListener('click', () => {
  const steps = [];
  function record(step) {
    steps.push(step);
    document.querySelector('#order').textContent = steps.join(' → ');
  }
  setTimeout(() => record('timer'), 0);
  Promise.resolve().then(() => record('microtask'));
  record('synchronization');
});
