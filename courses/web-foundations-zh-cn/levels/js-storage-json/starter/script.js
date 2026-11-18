const gearInput = document.querySelector('#gear-item');
const add = document.querySelector('#add-gear');
const list = document.querySelector('#gear-list');
const empty = document.querySelector('#gear-empty');
const storageKey = 'fieldGear';
const items = []; // 这里改成从存储读取并解析列表。

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
  // 将完整数组转换成 JSON 字符串并保存。
  gearInput.value = '';
  renderList();
});

renderList();
