function queryStatus(code) {
  const records = { 'A-6': 12, 'B-1': 0, 'D-3': 4 };
  if (!Object.hasOwn(records, code)) return Promise.reject(new Error('There is no such reservation'));
  return Promise.resolve({ code, seats: records[code] });
}

async function reservationLabel(code) {
  try {
    const record = await queryStatus(code);
    return `${record.code}: Seats left ${record.seats}`;
  } catch (error) {
    return 'Query failed: ' + error.message;
  }
}
