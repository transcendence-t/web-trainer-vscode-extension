const filter = document.querySelector('#filter');
let hits = 0;
function runSearch(keyword) {
  document.querySelector('#last-keyword').textContent = keyword;
  document.querySelector('#hits').textContent = ++hits;
}
let timeoutId;
filter.addEventListener('input', () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => runSearch(filter.value), 220);
});
