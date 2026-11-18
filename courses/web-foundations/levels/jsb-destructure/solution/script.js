function tagFields(record) {
  const { name: title, count: quantity = 1 } = record;
  return { title, quantity };
}
