const nicknameInput = document.querySelector('#nickname');
const save = document.querySelector('#save-name');
const savedName = document.querySelector('#saved-name');
const storageKey = 'visitorNickname';

savedName.textContent = localStorage.getItem(storageKey) ?? '暂无昵称';

save.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) return;

  localStorage.setItem(storageKey, nickname);
  savedName.textContent = nickname;
});
