function scoreFor(points, rule) {
  const rules = {
    double: (value) => value * 2,
    bonus: (value) => value + 3,
    penalty: (value) => value - 5,
  };
  return applyScore(points, rules[rule]);
}

function applyScore(points, transform = (value) => value * 2) {
  return Math.max(0, transform(points));
}
