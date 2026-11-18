const form = document.querySelector('#login-form');
const usernameField = document.querySelector('#login-name');
const passwordField = document.querySelector('#login-password');
const loginStatus = document.querySelector('#login-status');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = usernameField.value.trim();
  const password = passwordField.value;

  if (!username || !password) {
    loginStatus.textContent = '请填写账号和密码。';
  } else if (username === 'learner' && password === 'study123') {
    loginStatus.textContent = '登录成功。';
  } else {
    loginStatus.textContent = '账号或密码有误。';
  }
});
