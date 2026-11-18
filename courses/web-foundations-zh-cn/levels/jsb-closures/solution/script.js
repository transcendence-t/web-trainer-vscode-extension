function makeTicketQueue(start) {
  let current = start;
  return () => current++;
}

function showTickets(first, second) {
  const firstDesk = makeTicketQueue(first);
  const secondDesk = makeTicketQueue(second);
  return [firstDesk(), secondDesk(), firstDesk(), secondDesk()];
}
