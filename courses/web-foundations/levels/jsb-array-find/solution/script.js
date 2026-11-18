function findRecord(records, serial) {
  return records.find((item) => item.id === serial) ?? null;
}
