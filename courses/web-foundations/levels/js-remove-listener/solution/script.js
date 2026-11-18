const serve = document.querySelector('#serve');
const stop = document.querySelector('#stop');
const served = document.querySelector('#served');
let count = 0;
function recordVisit() {
  served.textContent = ++count;
}
serve.addEventListener('click', recordVisit);
stop.addEventListener('click', () => serve.removeEventListener('click', recordVisit));
