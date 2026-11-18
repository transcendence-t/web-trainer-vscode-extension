const generate = document.querySelector('#generate-receipt');
const receipt = document.querySelector('#receipt-status');

function showReceipt() {
  receipt.textContent = '回执已生成';
  generate.disabled = false;
}

generate.addEventListener('click', () => {
  receipt.textContent = '正在生成回执';
  generate.disabled = true;
  setTimeout(showReceipt, 500);
});
