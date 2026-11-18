function labelLine(text) {
  return text.split(',').map((part) => part.trim()).filter(Boolean).join(' / ');
}
