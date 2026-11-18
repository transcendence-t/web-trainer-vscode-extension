const dataset = document.querySelector('#dataset');
const events = document.querySelector('#events');
const notice = document.querySelector('#notice');

document.querySelector('#load').addEventListener('click', async () => {
  events.replaceChildren();
  try {
    const response = await fetch(dataset.value);
    if (!response.ok) throw new Error('Reading failed');
    const { activities } = await response.json();
    for (const name of activities) {
      const item = document.createElement('li');
      item.textContent = name;
      events.append(item);
    }
    notice.textContent = activities.length ? 'Activities updated' : 'No activities';
  } catch {
    notice.textContent = 'data cannot be read';
  }
});
