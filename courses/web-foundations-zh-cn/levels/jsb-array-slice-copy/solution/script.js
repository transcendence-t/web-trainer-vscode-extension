function comparePreview(entries, count) {
  const preview = peekLine(entries, count);
  return { preview, entries };
}

function peekLine(entries, count) {
  return entries.slice(0, count);
}
