const nicknameInput = document.querySelector('#nickname');
const save = document.querySelector('#save-name');
const savedName = document.querySelector('#saved-name');
const storageKey = 'visitorNickname';

// 页面加载时读取并显示已保存的昵称。

save.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) return;

  // 保存昵称，更新页面上的已保存昵称。
});
