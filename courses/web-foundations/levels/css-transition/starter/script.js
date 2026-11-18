const toggle = document.querySelector('#toggle-lamp');
const lamp = document.querySelector('#reading-lamp');

toggle.addEventListener('click', () => {
  const isOn = lamp.classList.toggle('is-on');
  toggle.setAttribute('aria-pressed', String(isOn));
});
