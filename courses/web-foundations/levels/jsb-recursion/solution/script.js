function countBoxes(n) {
  if (n === 0) return 0;
  return n + countBoxes(n - 1);
}
