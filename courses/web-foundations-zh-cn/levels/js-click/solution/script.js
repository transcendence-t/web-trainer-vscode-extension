const button = document.querySelector('#reserve');
const status = document.querySelector('#status');
button.addEventListener('click', () => {
  status.textContent = '报名成功';
});
