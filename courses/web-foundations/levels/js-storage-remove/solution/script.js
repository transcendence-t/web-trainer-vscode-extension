const density = document.querySelector('#density');
density.textContent = localStorage.getItem('density') ?? 'standard';
document.querySelector('#reset-density').addEventListener('click', () => {
  localStorage.removeItem('density');
  density.textContent = 'standard';
});
