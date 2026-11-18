const button = document.querySelector('#add');
const output = document.querySelector('#count');
let count = 0;
button.addEventListener('click', () => {
  count += 1;
  output.textContent = count;
});
