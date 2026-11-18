
function stationName(code) {
  switch (code) {
    case 'S':
      return 'sewing table';
    case 'C':
      return 'cutting table';
    case 'B':
      return 'binding table';
    default:
      return 'Unknown workstation';
  }
}
