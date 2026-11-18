const generate = document.querySelector('#generate-receipt');
const receipt = document.querySelector('#receipt-status');

function showReceipt() {
  receipt.textContent = 'receipt has been generated';
  generate.disabled = false;
}

generate.addEventListener('click', () => {
  receipt.textContent = 'Generating receipt';
  generate.disabled = true;
  setTimeout(showReceipt, 500);
});
