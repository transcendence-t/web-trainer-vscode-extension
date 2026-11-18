const cards = [
  { question: 'Which HTML tag represents a hyperlink?', answer: '<a>' },
  { question: 'Which CSS property sets text color?', answer: 'color' },
  { question: 'What is the subscript of the first element of the array?', answer: '0' },
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
  position.textContent = (cardIndex + 1) + ' / ' + cards.length;
  flip.textContent = answerSide ? 'Return to question' : 'Show answer';
  flip.setAttribute('aria-expanded', String(answerSide));
}

flip.addEventListener('click', () => {
  // Flip answerSide to show the other side of the card.
  renderCard();
});

next.addEventListener('click', () => {
  // Switch to the next card and return to the question side.
  renderCard();
});

renderCard();
