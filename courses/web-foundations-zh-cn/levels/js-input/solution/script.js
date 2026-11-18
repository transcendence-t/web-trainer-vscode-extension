const field = document.querySelector('#student');
const greeting = document.querySelector('#greeting');
field.addEventListener('input', () => {
  const name = field.value.trim() || '同学';
  greeting.textContent = `你好，${name}！`;
});
