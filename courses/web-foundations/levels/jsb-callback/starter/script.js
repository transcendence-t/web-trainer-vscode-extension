function scoreFor(points, rule) {
  const rules = {
    double: (value) => value * 2,
    bonus: (value) => value + 3,
    penalty: (value) => value - 5,
  };
  return applyScore(points, rules[rule]);
}

function applyScore(points, transform = (points) => points * 2) {
  // 完成本关函数。
}
