const equipment = [
  { name: 'Laser Kit', room: 'design', minutes: 35 },
  { name: 'Tripod Kit', room: 'photo', minutes: 10 },
  { name: 'Softbox', room: 'photo', minutes: 25 },
  { name: 'Sketch Kit', room: 'design', minutes: 15 },
];

const query = document.querySelector('#query');
const room = document.querySelector('#room');
const order = document.querySelector('#order');
const listing = document.querySelector('#equipment');
const count = document.querySelector('#count');

function render() {
  const term = query.value.trim().toLowerCase();
  const filtered = equipment.filter((item) =>
    item.name.toLowerCase().includes(term) && (room.value === 'all' || item.room === room.value)
  );
  const direction = order.value === 'desc' ? -1 : 1;
  const sorted = filtered.toSorted((first, second) => direction * (first.minutes - second.minutes));
  listing.replaceChildren();
  for (const item of sorted) {
    const row = document.createElement('li');
    row.textContent = item.name + ' · ' + item.minutes + ' minutes';
    listing.append(row);
  }
  count.textContent = sorted.length ? `${sorted.length} items in total` : 'No matching equipment';
}

query.addEventListener('input', render);
room.addEventListener('change', render);
order.addEventListener('change', render);
render();
