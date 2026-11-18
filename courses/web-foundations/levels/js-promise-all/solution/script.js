function readTitle(title) {
  if (title === '') return Promise.reject(new Error('Title is missing'));
  return new Promise((resolve) => setTimeout(() => resolve(title), 35));
}
function readTotal(total) {
  if (total < 0) return Promise.reject(new Error('Invalid quantity'));
  return Promise.resolve(total);
}

async function catalogCard(title, total) {
  try {
    const [name, count] = await Promise.all([readTitle(title), readTotal(total)]);
    return { title: name, total: count };
  } catch {
    return null;
  }
}
