const form = document.querySelector('#registration');
const reply = document.querySelector('#reply');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = data.get('name').trim();
  if (!name) {
    reply.textContent = '请输入有效姓名';
    return;
  }
  reply.textContent = name + '，已报名' + data.get('course');
});
