function askDesk(isAvailable) {
  if (isAvailable) return Promise.resolve('window 2');
  return Promise.reject(new Error('No service window is available right now'));
}

const desk = document.querySelector('#desk');
function requestDesk(isAvailable) {
  askDesk(isAvailable)
    .then((name) => { desk.textContent = 'Please go to ' + name; })
    .catch((error) => { desk.textContent = error.message; });
}
document.querySelector('#ready').addEventListener('click', () => requestDesk(true));
document.querySelector('#busy').addEventListener('click', () => requestDesk(false));
