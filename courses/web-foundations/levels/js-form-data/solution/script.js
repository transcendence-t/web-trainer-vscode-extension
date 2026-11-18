const form = document.querySelector('#application');
const receipt = document.querySelector('#receipt');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = data.get('visitor').trim();
  const sessions = data.getAll('session');
  receipt.textContent = name + '：' + (sessions.join('、') || '未选场次');
});
