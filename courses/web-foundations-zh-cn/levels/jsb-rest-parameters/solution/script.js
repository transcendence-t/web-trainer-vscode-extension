function shippedCount(prior, ...batches) {
  let total = prior;
  for (const batch of batches) total += batch;
  return total;
}
