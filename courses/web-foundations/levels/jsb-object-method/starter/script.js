function rackLabel(prefix, number) {
  const record = {
    prefix,
    number,
    label() {
      // Use the attributes of this record to generate labels.
    },
  };
  return record.label();
}
