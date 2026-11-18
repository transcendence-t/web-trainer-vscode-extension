const budgetInCents = 30000;
const expenses = [];
const amount = document.querySelector('#expense-amount');
const addExpense = document.querySelector('#add-expense');
const total = document.querySelector('#expense-total');
const remaining = document.querySelector('#expense-remaining');
const error = document.querySelector('#expense-error');

function formatAmount(cents) {
  return (cents / 100).toFixed(2) + ' yuan';
}

function renderBudget() {
  let spent = 0;
  // Accumulate the amount in expenses to spent.
  total.textContent = formatAmount(spent);
  remaining.textContent = formatAmount(budgetInCents - spent);
}

addExpense.addEventListener('click', () => {
  // Verify input first. If the amount is invalid, a prompt will be displayed and this click process will be exited.
  const cents = Math.round(Number(amount.value) * 100);
  expenses.push(cents);
  error.textContent = '';
  amount.value = '';
  renderBudget();
});

renderBudget();
