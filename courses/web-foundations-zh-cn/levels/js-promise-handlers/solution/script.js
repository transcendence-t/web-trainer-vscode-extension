function askDesk(isAvailable) {
  if (isAvailable) return Promise.resolve('窗口 2');
  return Promise.reject(new Error('暂时无法分配'));
}

const desk = document.querySelector('#desk');
function requestDesk(isAvailable) {
  askDesk(isAvailable)
    .then((name) => { desk.textContent = '请到 ' + name; })
    .catch((error) => { desk.textContent = error.message; });
}
document.querySelector('#ready').addEventListener('click', () => requestDesk(true));
document.querySelector('#busy').addEventListener('click', () => requestDesk(false));
