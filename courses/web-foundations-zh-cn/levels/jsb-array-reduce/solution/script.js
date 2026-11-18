function totalGrams(items) {
  return items.reduce((sum, item) => sum + item.grams, 0);
}
