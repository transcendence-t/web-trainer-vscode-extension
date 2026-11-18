const budgetInCents = 30000;
const expenses = [];
const amount = document.querySelector('#expense-amount');
const addExpense = document.querySelector('#add-expense');
const total = document.querySelector('#expense-total');
const remaining = document.querySelector('#expense-remaining');
const error = document.querySelector('#expense-error');

function formatAmount(cents) {
  return (cents / 100).toFixed(2) + ' 元';
}

function renderBudget() {
  let spent = 0;
  // 把 expenses 中的金额累加到 spent。
  total.textContent = formatAmount(spent);
  remaining.textContent = formatAmount(budgetInCents - spent);
}

addExpense.addEventListener('click', () => {
  // 先校验输入。若金额无效则显示提示，并退出本次点击处理。
  const cents = Math.round(Number(amount.value) * 100);
  expenses.push(cents);
  error.textContent = '';
  amount.value = '';
  renderBudget();
});

renderBudget();
