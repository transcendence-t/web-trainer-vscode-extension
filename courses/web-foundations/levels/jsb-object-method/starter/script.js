function rackLabel(prefix, number) {
  const record = {
    prefix,
    number,
    label() {
      // 使用本条记录的属性生成标签。
    },
  };
  return record.label();
}
