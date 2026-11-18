function readStop(stops, index) {
  if (index < 0 || index >= stops.length) {
    return null;
  }
  return stops[index];
}
