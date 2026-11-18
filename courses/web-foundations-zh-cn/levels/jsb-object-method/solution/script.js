function rackLabel(prefix, number) {
  const record = { prefix, number, label() { return this.prefix + '-' + this.number; } };
  return record.label();
}
