const form = document.querySelector('#login-form');
const usernameField = document.querySelector('#login-name');
const passwordField = document.querySelector('#login-password');
const loginStatus = document.querySelector('#login-status');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = usernameField.value.trim();
  const password = passwordField.value;

  if (!username || !password) {
    loginStatus.textContent = 'Please fill in your account number and password.';
  } else if (username === 'learner' && password === 'study123') {
    loginStatus.textContent = 'Login successful.';
  } else {
    loginStatus.textContent = 'The account number or password is incorrect.';
  }
});
