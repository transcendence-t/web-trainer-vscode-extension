const firstField = document.querySelector('#first-number');
const secondField = document.querySelector('#second-number');
const output = document.querySelector('#calc-result');

function calculate(operation) {
  const firstText = firstField.value.trim();
  const secondText = secondField.value.trim();
  const first = Number(firstText);
  const second = Number(secondText);

  if (firstText === '' || secondText === '' || !Number.isFinite(first) || !Number.isFinite(second)) {
    output.textContent = 'Please enter two valid digits.';
    return;
  }

  const result = operation === 'add' ? first + second : first - second;
  output.textContent = String(result);
}

document.querySelector('#calc-add').addEventListener('click', () => calculate('add'));
document.querySelector('#calc-subtract').addEventListener('click', () => calculate('subtract'));
