
function screeningCapacity(rows) {
  let total = 0;
  for (let row = 1; row <= rows; row += 1) {
    const seats = 4 + (row - 1) * 2;
    total += seats;
  }
  return total;
}
