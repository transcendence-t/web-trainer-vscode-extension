document.querySelector('#rows').addEventListener('click', (event) => {
  const button = event.target.closest('button.remove');
  if (button) button.closest('li').remove();
});
