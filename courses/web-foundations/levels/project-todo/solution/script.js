const form = document.querySelector('#todo-form');
const field = document.querySelector('#task-input');
const list = document.querySelector('#task-list');
const template = document.querySelector('#task-template');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = field.value.trim();
  if (!title) return;

  const row = template.content.cloneNode(true);
  row.querySelector('.task-title').textContent = title;
  list.append(row);
  field.value = '';
});

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const row = button.closest('.task-row');
  if (button.dataset.action === 'delete') {
    row.remove();
    return;
  }

  const done = row.classList.toggle('is-done');
  button.setAttribute('aria-pressed', String(done));
});
