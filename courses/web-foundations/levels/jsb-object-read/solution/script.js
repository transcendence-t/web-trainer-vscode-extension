function readFreeSeats(room) {
  if (room.freeSeats === undefined) {
    return null;
  }
  return room.freeSeats;
}
