function isMirrorCode(text) {
  const code = text.toLowerCase().replaceAll(' ', '');
  return code.length > 0 && code === [...code].reverse().join('');
}
