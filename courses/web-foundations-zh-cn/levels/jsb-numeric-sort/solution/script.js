function compareOrder(readings) {
  const sorted = sortReadings(readings);
  return [sorted, readings];
}

function sortReadings(readings) {
  return readings.toSorted((a, b) => a - b);
}
