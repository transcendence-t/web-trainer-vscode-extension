class SupplyBox {
  constructor(initial) {
    // 保存初始数量。
  }
  receive(count) {
    // 增加入库数量。
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
