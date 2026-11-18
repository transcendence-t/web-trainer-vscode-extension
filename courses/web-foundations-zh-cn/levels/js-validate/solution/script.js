const form = document.querySelector('#submission-form');
const titleField = document.querySelector('#work-title');
const feedback = document.querySelector('#submission-feedback');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = titleField.value.trim();
  if (title.length === 0) {
    feedback.textContent = '请填写作品标题。';
    return;
  }
  if (title.length < 3) {
    feedback.textContent = '标题至少需要 3 个字符。';
    return;
  }
  feedback.textContent = '作品标题《' + title + '》已通过检查。';
});
