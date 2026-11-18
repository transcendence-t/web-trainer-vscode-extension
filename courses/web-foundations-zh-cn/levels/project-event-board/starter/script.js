const events = [
  { id: 'print', title: '版画工作坊', category: 'workshop', showtime: '09:30 · 工作坊' },
  { id: 'museum', title: '校史馆导览', category: 'tour', showtime: '10:00 · 导览' },
  { id: 'sound', title: '声音剪辑体验', category: 'workshop', showtime: '13:30 · 工作坊' },
  { id: 'garden', title: '植物园导览', category: 'tour', showtime: '14:00 · 导览' },
];
const category = document.querySelector('#event-category');
const list = document.querySelector('#event-list');
const storageKey = 'campusEventFavorites';
let favorites = []; // 读取已保存的活动 ID 数组。

function toggleFavorite(id, button) {
  // 追加或移除活动 ID，保存完整数组并同步按钮状态。
}

function renderEvents() {
  const visible = events; // 按选中的分类筛选。
  list.replaceChildren();
  for (const event of visible) {
    const row = document.createElement('li');
    row.className = 'event';
    row.dataset.eventId = event.id;
    row.dataset.category = event.category;

    const information = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = event.title;
    const when = document.createElement('p');
    when.textContent = event.showtime;
    information.append(title, when);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'favorite-button';
    button.textContent = '收藏';
    button.setAttribute('aria-label', '收藏 ' + event.title);
    button.setAttribute('aria-pressed', String(favorites.includes(event.id)));
    button.addEventListener('click', () => toggleFavorite(event.id, button));
    row.append(information, button);
    list.append(row);
  }
}

category.addEventListener('change', renderEvents);
renderEvents();
