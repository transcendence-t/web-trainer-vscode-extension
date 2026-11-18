class SupplyBox {
  constructor(initial) { this.quantity = initial; }
  receive(count) { this.quantity += count; }
  total() { return this.quantity; }
}

function runBoxes(left, right, leftAdd, rightAdd) {
  const first = new SupplyBox(left);
  const second = new SupplyBox(right);
  first.receive(leftAdd);
  second.receive(rightAdd);
  first.receive(2);
  return [first.total(), second.total()];
}
