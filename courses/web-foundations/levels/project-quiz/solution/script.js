const questions = [
  {
    prompt: 'Which link address can jump to the block with the id of gallery?',
    options: ['gallery', '#gallery', '/gallery'],
    correct: 1,
  },
  {
    prompt: 'Which attribute provides alt text for an image?',
    options: ['title', 'src', 'alt'],
    correct: 2,
  },
];
const questionHeading = document.querySelector('#quiz-question');
const choices = document.querySelector('#quiz-options');
const feedback = document.querySelector('#quiz-feedback');
const scoreLabel = document.querySelector('#quiz-score');
const nextButton = document.querySelector('#quiz-next');
let questionIndex = 0;
let score = 0;

function showQuestion() {
  const question = questions[questionIndex];
  questionHeading.textContent = question.prompt;
  choices.replaceChildren();
  for (let index = 0; index < question.options.length; index += 1) {
    const option = document.createElement('button');
    option.type = 'button';
    option.textContent = question.options[index];
    option.dataset.choice = String(index);
    choices.append(option);
  }
  feedback.textContent = 'Please select an answer.';
  nextButton.textContent = questionIndex === questions.length - 1 ? 'View results' : 'Next question';
  nextButton.disabled = true;
}

showQuestion();

choices.addEventListener('click', (event) => {
  const option = event.target.closest('button[data-choice]');
  if (!option || option.disabled) return;

  const question = questions[questionIndex];
  if (Number(option.dataset.choice) === question.correct) {
    score += 1;
    feedback.textContent = 'answered correctly.';
  } else {
    feedback.textContent = 'The correct answer is "' + question.options[question.correct] + '".';
  }
  scoreLabel.textContent = String(score);
  for (const button of choices.querySelectorAll('button')) {
    button.disabled = true;
  }
  nextButton.disabled = false;
});

nextButton.addEventListener('click', () => {
  questionIndex += 1;
  if (questionIndex < questions.length) {
    showQuestion();
    return;
  }

  questionHeading.textContent = 'test ended';
  choices.replaceChildren();
  feedback.textContent = 'Score: ' + score + ' / ' + questions.length;
  nextButton.disabled = true;
});
