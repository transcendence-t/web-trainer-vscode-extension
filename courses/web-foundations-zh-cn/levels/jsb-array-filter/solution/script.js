function selectReadyBatches(counts, minimum) {
  return counts.filter((count) => count >= minimum);
}
