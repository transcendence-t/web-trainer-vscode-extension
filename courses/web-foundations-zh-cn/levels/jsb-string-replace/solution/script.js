function fillRoom(template, room) {
  return template.replaceAll('{room}', () => room);
}
