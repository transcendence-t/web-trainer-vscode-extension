const draft = document.querySelector('#draft');
const output = document.querySelector('#literal');
draft.addEventListener('input', () => {
  output.textContent = draft.value || 'Waiting for input';
});
