const form = document.querySelector('#registration');
const reply = document.querySelector('#reply');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = data.get('name').trim();
  if (!name) {
    reply.textContent = 'Please enter a valid name';
    return;
  }
  reply.textContent = name + ', registered for: ' + data.get('course');
});
