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
  for (const cents of expenses) {
    spent += cents;
  }
  total.textContent = formatAmount(spent);
  remaining.textContent = formatAmount(budgetInCents - spent);
}

addExpense.addEventListener('click', () => {
  if (!amount.checkValidity()) {
    error.textContent = 'Please enter an amount greater than 0 and with up to two decimal places.';
    return;
  }
  const cents = Math.round(Number(amount.value) * 100);
  expenses.push(cents);
  error.textContent = '';
  amount.value = '';
  renderBudget();
});

renderBudget();
