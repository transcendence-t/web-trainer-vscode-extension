const cards = [
  { question: '哪个 HTML 标签表示超链接？', answer: '<a>' },
  { question: '哪个 CSS 属性设置文字颜色？', answer: 'color' },
  { question: '数组第一个元素的下标是多少？', answer: '0' },
];
const position = document.querySelector('#card-position');
const question = document.querySelector('#card-question');
const answer = document.querySelector('#card-answer');
const flip = document.querySelector('#flip-card');
const next = document.querySelector('#next-card');
let cardIndex = 0;
let answerSide = false;

function renderCard() {
  const card = cards[cardIndex];
  question.textContent = card.question;
  answer.textContent = card.answer;
  question.hidden = answerSide;
  answer.hidden = !answerSide;
  position.textContent = '第 ' + (cardIndex + 1) + ' / ' + cards.length + ' 张';
  flip.textContent = answerSide ? '返回题目' : '显示答案';
  flip.setAttribute('aria-expanded', String(answerSide));
}

flip.addEventListener('click', () => {
  answerSide = !answerSide;
  renderCard();
});

next.addEventListener('click', () => {
  cardIndex = (cardIndex + 1) % cards.length;
  answerSide = false;
  renderCard();
});

renderCard();
