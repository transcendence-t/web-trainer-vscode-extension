function archiveDay(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}
