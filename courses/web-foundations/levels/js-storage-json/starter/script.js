const gearInput = document.querySelector('#gear-item');
const add = document.querySelector('#add-gear');
const list = document.querySelector('#gear-list');
const empty = document.querySelector('#gear-empty');
const storageKey = 'fieldGear';
const items = []; // This is changed to read and parse the list from storage.

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
  // Convert the complete array into a JSON string and save it.
  gearInput.value = '';
  renderList();
});

renderList();
