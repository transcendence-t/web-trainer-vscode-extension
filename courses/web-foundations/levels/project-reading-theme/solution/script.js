const reader = document.querySelector('#reader');
const toggle = document.querySelector('#theme-toggle');

function showTheme(theme) {
  reader.dataset.theme = theme;
  toggle.setAttribute('aria-pressed', String(theme === 'dark'));
}

showTheme(localStorage.getItem('reader-theme') ?? 'light');
toggle.addEventListener('click', () => {
  const nextTheme = reader.dataset.theme === 'dark' ? 'light' : 'dark';
  showTheme(nextTheme);
  localStorage.setItem('reader-theme', nextTheme);
});
