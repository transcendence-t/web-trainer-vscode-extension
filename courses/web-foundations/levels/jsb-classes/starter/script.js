class SupplyBox {
  constructor(initial) {
    // saves the initial quantity.
  }
  receive(count) {
    // Increase the warehousing quantity.
  }
  total() {
    return 0;
  }
}

function runBoxes(left, right, leftAdd, rightAdd) {
  const first = new SupplyBox(left);
  const second = new SupplyBox(right);
  first.receive(leftAdd);
  second.receive(rightAdd);
  first.receive(2);
  return [first.total(), second.total()];
}
