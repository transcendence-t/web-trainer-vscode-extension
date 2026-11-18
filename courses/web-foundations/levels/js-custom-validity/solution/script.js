const password = document.querySelector('#password');
const confirm = document.querySelector('#confirm');
const feedback = document.querySelector('#feedback');
function validateMatch() {
  const message = confirm.value && confirm.value !== password.value ? 'Two passwords are inconsistent' : '';
  confirm.setCustomValidity(message);
  feedback.textContent = message;
}
password.addEventListener('input', validateMatch);
confirm.addEventListener('input', validateMatch);
