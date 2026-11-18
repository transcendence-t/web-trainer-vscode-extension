const gearInput = document.querySelector('#gear-item');
const add = document.querySelector('#add-gear');
const list = document.querySelector('#gear-list');
const empty = document.querySelector('#gear-empty');
const storageKey = 'fieldGear';
const items = JSON.parse(localStorage.getItem(storageKey) ?? '[]');

function renderList() {
  list.replaceChildren();
  for (const item of items) {
    const row = document.createElement('li');
    row.textContent = item;
    list.append(row);
  }
  empty.hidden = items.length > 0;
}

add.addEventListener('click', () => {
  const item = gearInput.value.trim();
  if (!item) return;

  items.push(item);
  localStorage.setItem(storageKey, JSON.stringify(items));
  gearInput.value = '';
  renderList();
});

renderList();
