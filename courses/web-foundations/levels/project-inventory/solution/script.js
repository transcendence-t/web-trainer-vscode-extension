const devices = ['USB microphone', 'USB camera', 'digital voice recorder', 'portable projector'];
const query = document.querySelector('#equipment-query');
const list = document.querySelector('#equipment-results');
const count = document.querySelector('#equipment-count');
const empty = document.querySelector('#equipment-empty');

function renderDevices(matches) {
  list.replaceChildren();
  for (const device of matches) {
    const row = document.createElement('li');
    row.textContent = device;
    list.append(row);
  }
  count.textContent = matches.length + ' devices found';
  empty.hidden = matches.length !== 0;
}

query.addEventListener('input', () => {
  const keyword = query.value.trim().toLowerCase();
  const matches = devices.filter((device) => device.toLowerCase().includes(keyword));
  renderDevices(matches);
});

renderDevices(devices);
