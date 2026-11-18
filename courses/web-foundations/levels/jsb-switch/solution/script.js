
function stationName(code) {
  switch (code) {
    case 'S':
      return '缝纫台';
    case 'C':
      return '裁纸台';
    case 'B':
      return '装订台';
    default:
      return '未知工位';
  }
}
