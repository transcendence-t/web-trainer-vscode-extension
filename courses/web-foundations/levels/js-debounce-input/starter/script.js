const filter = document.querySelector('#filter');
let hits = 0;
function runSearch(keyword) {
  document.querySelector('#last-keyword').textContent = keyword;
  document.querySelector('#hits').textContent = ++hits;
}

// Schedules a delayed search.
