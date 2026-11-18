const tableName = document.querySelector('#table-name');
const tableCard = document.querySelector('#table-card');

tableName.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  tableCard.textContent = tableName.value;
});
