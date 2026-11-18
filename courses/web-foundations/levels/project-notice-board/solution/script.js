const fixtures = {
  main: { notices: [
    { title: 'collection experience', room: 'Photography Studio' },
    { title: '<Review> Purchase List', room: 'Equipment Library' },
  ] },
  empty: { notices: [] },
};

function localUrl(kind) {
  if (kind === 'error') return 'data:application/json,%7B';
  return 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fixtures[kind]));
}

function simulateWait() {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

const sample = document.querySelector('#demo');
const button = document.querySelector('#refresh');
const state = document.querySelector('#state');
const notices = document.querySelector('#notices');

button.addEventListener('click', async () => {
  button.disabled = true;
  state.textContent = 'Loading';
  notices.replaceChildren();
  const url = localUrl(sample.value);
  try {
    await simulateWait();
    const response = await fetch(url);
    if (!response.ok) throw new Error('Reading failed');
    const { notices: records } = await response.json();
    for (const record of records) {
      const item = document.createElement('li');
      item.textContent = record.title + ' · ' + record.room;
      notices.append(item);
    }
    state.textContent = records.length ? `Loaded ${records.length} notices` : 'No notification yet';
  } catch {
    state.textContent = 'Unable to read notification, please try again';
  } finally {
    button.disabled = false;
  }
});
