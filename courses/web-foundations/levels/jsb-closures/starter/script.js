function makeTicketQueue(start) {
  // returns a function that can update the current serial number.
  return () => start;
}

function showTickets(first, second) {
  const firstDesk = makeTicketQueue(first);
  const secondDesk = makeTicketQueue(second);
  return [firstDesk(), secondDesk(), firstDesk(), secondDesk()];
}
