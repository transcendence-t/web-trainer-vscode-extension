const events = [
  { id: 'print', title: 'Printmaking Workshop', category: 'workshop', showtime: '09:30 · Workshop' },
  { id: 'museum', title: 'School History Museum Guide', category: 'tour', showtime: '10:00 · Tour' },
  { id: 'sound', title: 'sound editing experience', category: 'workshop', showtime: '13:30 · Workshop' },
  { id: 'garden', title: 'Botanical Garden Guide', category: 'tour', showtime: '14:00 · Tour' },
];
const category = document.querySelector('#event-category');
const list = document.querySelector('#event-list');
const storageKey = 'campusEventFavorites';
let favorites = []; // Reads the saved activity ID array.

function toggleFavorite(id, button) {
  // Appends or removes activity IDs, saves the complete array and synchronizes button states.
}

function renderEvents() {
  const visible = events; // Filter by selected category.
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
    button.textContent = 'Collection';
    button.setAttribute('aria-label', 'Collection ' + event.title);
    button.setAttribute('aria-pressed', String(favorites.includes(event.id)));
    button.addEventListener('click', () => toggleFavorite(event.id, button));
    row.append(information, button);
    list.append(row);
  }
}

category.addEventListener('change', renderEvents);
renderEvents();
