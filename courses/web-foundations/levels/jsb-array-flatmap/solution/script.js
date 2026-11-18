function participantNames(rooms) {
  return rooms.flatMap((room) => room.names);
}
