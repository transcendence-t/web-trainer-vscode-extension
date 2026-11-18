const toggle = document.querySelector('#toggle-guide');
const guide = document.querySelector('#loan-guide');

toggle.addEventListener('click', () => {
  guide.hidden = !guide.hidden;
  toggle.setAttribute('aria-expanded', String(!guide.hidden));
});
