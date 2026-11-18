const button = document.querySelector('#reserve');
const status = document.querySelector('#status');
button.addEventListener('click', () => {
  status.textContent = 'registration successful';
});
