const density = document.querySelector('#density');
density.textContent = localStorage.getItem('density') ?? '标准';
document.querySelector('#reset-density').addEventListener('click', () => {
  localStorage.removeItem('density');
  density.textContent = '标准';
});
