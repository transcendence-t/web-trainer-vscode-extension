function readField(record, field) {
  return Object.hasOwn(record, field) ? record[field] : null;
}
