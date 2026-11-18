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

// Process the option click first, then implement the next question and view the results.
