const questions = [
  {
    prompt: '哪个链接地址能跳到 id 为 gallery 的区块？',
    options: ['gallery', '#gallery', '/gallery'],
    correct: 1,
  },
  {
    prompt: '哪个属性为图片提供替代文字？',
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
  feedback.textContent = '请选择一个答案。';
  nextButton.textContent = questionIndex === questions.length - 1 ? '查看结果' : '下一题';
  nextButton.disabled = true;
}

showQuestion();

choices.addEventListener('click', (event) => {
  const option = event.target.closest('button[data-choice]');
  if (!option || option.disabled) return;

  const question = questions[questionIndex];
  if (Number(option.dataset.choice) === question.correct) {
    score += 1;
    feedback.textContent = '回答正确。';
  } else {
    feedback.textContent = '正确答案是「' + question.options[question.correct] + '」。';
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

  questionHeading.textContent = '测验结束';
  choices.replaceChildren();
  feedback.textContent = '共答对 ' + score + ' 题。';
  nextButton.disabled = true;
});
