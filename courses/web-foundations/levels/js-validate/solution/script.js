const form = document.querySelector('#submission-form');
const titleField = document.querySelector('#work-title');
const feedback = document.querySelector('#submission-feedback');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = titleField.value.trim();
  if (title.length === 0) {
    feedback.textContent = 'Please fill in the title of the work.';
    return;
  }
  if (title.length < 3) {
    feedback.textContent = 'Title requires at least 3 characters.';
    return;
  }
  feedback.textContent = 'The title of the work "' + title + '" has passed the inspection.';
});
