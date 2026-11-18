function inventoryRows(inventory) {
  return Object.entries(inventory)
    .filter(([, quantity]) => quantity > 0)
    .map(([name, quantity]) => ({ name, quantity }));
}
