function readTitle(title) {
  if (title === '') return Promise.reject(new Error('标题缺失'));
  return new Promise((resolve) => setTimeout(() => resolve(title), 35));
}
function readTotal(total) {
  if (total < 0) return Promise.reject(new Error('数量无效'));
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
