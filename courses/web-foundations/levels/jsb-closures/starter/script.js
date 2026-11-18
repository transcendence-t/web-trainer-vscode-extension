function makeTicketQueue(start) {
  // 返回一个能够更新当前序号的函数。
  return () => start;
}

function showTickets(first, second) {
  const firstDesk = makeTicketQueue(first);
  const secondDesk = makeTicketQueue(second);
  return [firstDesk(), secondDesk(), firstDesk(), secondDesk()];
}
