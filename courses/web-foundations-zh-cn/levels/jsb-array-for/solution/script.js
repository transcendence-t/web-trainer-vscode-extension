function totalCheckouts(counts) {
  let total = 0;
  for (let index = 0; index < counts.length; index += 1) {
    total += counts[index];
  }
  return total;
}
