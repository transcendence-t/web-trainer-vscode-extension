for (const button of document.querySelectorAll('.room-button')) {
  button.addEventListener('click', (event) => {
    const code = event.currentTarget.dataset.roomCode;
    document.querySelector('#selection').textContent = 'Current area: ' + code;
  });
}
