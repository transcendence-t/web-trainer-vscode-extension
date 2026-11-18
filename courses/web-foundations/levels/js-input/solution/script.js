const field = document.querySelector('#student');
const greeting = document.querySelector('#greeting');
field.addEventListener('input', () => {
  const name = field.value.trim() || 'classmate';
  greeting.textContent = `Hello, ${name}!`;
});
