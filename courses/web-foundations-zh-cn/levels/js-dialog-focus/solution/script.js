const open = document.querySelector('#open');
const dialog = document.querySelector('#rules-dialog');
const dismiss = document.querySelector('#dismiss');
open.addEventListener('click', () => {
  dialog.showModal();
  dismiss.focus();
});
dismiss.addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => open.focus());
