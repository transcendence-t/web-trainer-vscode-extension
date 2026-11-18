function queryStatus(code) {
  const records = { 'A-6': 12, 'B-1': 0, 'D-3': 4 };
  if (!Object.hasOwn(records, code)) return Promise.reject(new Error('没有这条预约'));
  return Promise.resolve({ code, seats: records[code] });
}

async function reservationLabel(code) {
  try {
    const record = await queryStatus(code);
    return `${record.code}：余位 ${record.seats}`;
  } catch (error) {
    return '查询失败：' + error.message;
  }
}
