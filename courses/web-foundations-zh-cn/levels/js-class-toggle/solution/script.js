const saveButton = document.querySelector('#save-resource');

saveButton.addEventListener('click', () => {
  const saved = saveButton.classList.toggle('is-saved');
  saveButton.setAttribute('aria-pressed', String(saved));
});
