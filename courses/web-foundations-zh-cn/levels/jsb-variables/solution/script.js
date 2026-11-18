function updateStock(initialStock, received, shipped) {
  let stock = initialStock;
  stock = stock + received;
  stock = stock - shipped;
  return stock;
}
