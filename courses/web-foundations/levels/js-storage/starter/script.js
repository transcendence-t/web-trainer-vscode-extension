const nicknameInput = document.querySelector('#nickname');
const save = document.querySelector('#save-name');
const savedName = document.querySelector('#saved-name');
const storageKey = 'visitorNickname';

// Reads and displays the saved nickname when the page loads.

save.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) return;

  // Save the nickname and update the saved nickname on the page.
});
