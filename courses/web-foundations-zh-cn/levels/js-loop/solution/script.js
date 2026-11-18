const button = document.querySelector('#make-list');
const list = document.querySelector('#days');
button.addEventListener('click', () => {
  list.replaceChildren();
  for (let day = 1; day <= 5; day++) {
    const item = document.createElement('li');
    item.textContent = `第 ${day} 天`;
    list.append(item);
  }
});
