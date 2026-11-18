document.querySelector('#mark').addEventListener('click', () => {
  for (const item of document.querySelectorAll('.pending')) {
    item.textContent = '已核对';
  }
});
